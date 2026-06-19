"""Unit tests for the recommendation engine.

Tests cover the generate_insights() async function with mocked activity data,
verifying that recommendations are generated, ranked, and filtered correctly,
and that badges are awarded based on user state.
"""

import logging
from datetime import date, timedelta

import pytest

from app.models.user import UserProfile
from app.services.recommendation_engine import BADGES, CATEGORIES, generate_insights

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

MOCK_PROFILE = UserProfile(
    uid="test-uid",
    email="test@example.com",
    display_name="Test User",
    region="UK",
    diet_type="average",
    household_size=1,
    created_at="2026-01-01T00:00:00+00:00",
    streak=0,
    badges=[],
)


def _make_activity(
    category: str,
    subcategory: str,
    carbon_kg: float,
    days_ago: int = 1,
) -> dict:
    """Create a minimal activity dict for testing.

    Args:
        category: Activity category string.
        subcategory: Activity subcategory string.
        carbon_kg: Pre-calculated CO₂e in kg.
        days_ago: How many days ago the activity occurred.

    Returns:
        Dict mimicking a Firestore activity document in snake_case.
    """
    activity_date = (date.today() - timedelta(days=days_ago)).isoformat()
    return {
        "category": category,
        "subcategory": subcategory,
        "carbon_kg": carbon_kg,
        "date": activity_date,
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestGenerateInsights:
    """Tests for the generate_insights() async function."""

    async def test_empty_activities_returns_zero_footprint(self) -> None:
        """With no activities, footprint_kg is 0 and recommendations are empty.

        Returns:
            None
        """
        result = await generate_insights("uid", [], [], MOCK_PROFILE)
        assert result.footprint_kg == 0.0
        assert result.recommendations == []
        assert result.top_category is None

    async def test_total_footprint_is_sum_of_carbon_kg(self) -> None:
        """footprint_kg equals the sum of all carbon_kg values.

        Returns:
            None
        """
        activities = [
            _make_activity("transport", "car_petrol", 50.0),
            _make_activity("food", "beef", 30.0),
        ]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        assert result.footprint_kg == pytest.approx(80.0, abs=0.01)

    async def test_top_category_identified_correctly(self) -> None:
        """top_category is the category with the highest CO₂e contribution.

        Returns:
            None
        """
        activities = [
            _make_activity("transport", "car_petrol", 100.0),
            _make_activity("food", "beef", 20.0),
        ]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        assert result.top_category == "transport"

    async def test_recommendations_sorted_by_saving_descending(self) -> None:
        """Recommendations are returned sorted by estimated_saving_kg descending.

        Returns:
            None
        """
        activities = [
            _make_activity("transport", "car_petrol", 200.0),
            _make_activity("transport", "car_diesel", 200.0),
            _make_activity("food", "beef", 100.0),
        ]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        savings = [r.estimated_saving_kg for r in result.recommendations]
        assert savings == sorted(savings, reverse=True)

    async def test_maximum_5_recommendations_returned(self) -> None:
        """At most 5 recommendations are returned even when more rules fire.

        Returns:
            None
        """
        activities = [
            _make_activity("transport", "car_petrol", 150.0),
            _make_activity("transport", "car_diesel", 150.0),
            _make_activity("food", "beef", 100.0),
            _make_activity("food", "lamb", 50.0),
            _make_activity("energy", "electricity_uk", 50.0),
            _make_activity("energy", "natural_gas", 50.0),
            _make_activity("shopping", "clothing_new", 50.0),
            _make_activity("waste", "landfill", 20.0),
        ]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        assert len(result.recommendations) <= 5

    async def test_monthly_change_positive_when_footprint_increased(self) -> None:
        """monthly_change_percent is positive when current > previous period.

        Returns:
            None
        """
        current = [_make_activity("transport", "car_petrol", 100.0)]
        previous = [_make_activity("transport", "car_petrol", 50.0, days_ago=35)]
        result = await generate_insights("uid", current, previous, MOCK_PROFILE)
        assert result.monthly_change_percent > 0

    async def test_monthly_change_negative_when_footprint_decreased(self) -> None:
        """monthly_change_percent is negative when current < previous period.

        Returns:
            None
        """
        current = [_make_activity("transport", "car_petrol", 30.0)]
        previous = [_make_activity("transport", "car_petrol", 100.0, days_ago=35)]
        result = await generate_insights("uid", current, previous, MOCK_PROFILE)
        assert result.monthly_change_percent < 0

    async def test_first_log_badge_awarded(self) -> None:
        """first_log badge is awarded when activities_current is non-empty.

        Returns:
            None
        """
        activities = [_make_activity("transport", "car_petrol", 10.0)]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        assert "first_log" in result.achievements

    async def test_no_badges_when_no_activities(self) -> None:
        """No activity-dependent badges are awarded when there are no activities.

        Returns:
            None
        """
        result = await generate_insights("uid", [], [], MOCK_PROFILE)
        assert "first_log" not in result.achievements

    async def test_below_average_badge_awarded_for_low_footprint(self) -> None:
        """below_average badge is awarded when annual estimate is below UK average.

        Returns:
            None
        """
        # UK average is 6300 kg/year. 30-day budget = 6300/365*30 ≈ 517 kg.
        # Use a tiny footprint to guarantee below average.
        activities = [_make_activity("transport", "cycling", 0.0)]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        assert "below_average" in result.achievements

    async def test_week_streak_badge_awarded_at_7_days(self) -> None:
        """week_streak badge is awarded when user streak is >= 7.

        Returns:
            None
        """
        profile_with_streak = UserProfile(
            uid="test-uid",
            email="test@example.com",
            display_name="Test User",
            region="UK",
            diet_type="average",
            household_size=1,
            created_at="2026-01-01T00:00:00+00:00",
            streak=7,
            badges=[],
        )
        activities = [_make_activity("transport", "cycling", 0.0)]
        result = await generate_insights("uid", activities, [], profile_with_streak)
        assert "week_streak" in result.achievements

    async def test_generated_at_is_iso_string(self) -> None:
        """generated_at is a non-empty ISO format string.

        Returns:
            None
        """
        result = await generate_insights("uid", [], [], MOCK_PROFILE)
        assert isinstance(result.generated_at, str)
        assert "T" in result.generated_at

    async def test_vs_average_percent_negative_for_zero_footprint(self) -> None:
        """vs_average_percent is negative when footprint is zero (below average).

        Returns:
            None
        """
        result = await generate_insights("uid", [], [], MOCK_PROFILE)
        assert result.vs_average_percent <= 0

    async def test_recommendation_has_required_fields(self) -> None:
        """Each Recommendation object has all required fields populated.

        Returns:
            None
        """
        activities = [
            _make_activity("transport", "car_petrol", 150.0),
            _make_activity("transport", "car_diesel", 150.0),
        ]
        result = await generate_insights("uid", activities, [], MOCK_PROFILE)
        assert len(result.recommendations) > 0
        rec = result.recommendations[0]
        assert rec.id
        assert rec.title
        assert rec.description
        assert rec.category
        assert rec.estimated_saving_kg >= 0
        assert rec.difficulty in {"easy", "medium", "hard"}

    async def test_badges_constant_covers_all_expected_ids(self) -> None:
        """BADGES dict contains all 10 expected badge IDs.

        Returns:
            None
        """
        expected = {
            "first_log",
            "week_streak",
            "month_streak",
            "below_average",
            "carbon_cutter",
            "green_champion",
            "goal_setter",
            "goal_achiever",
            "low_transport",
            "plant_powered",
        }
        assert expected == set(BADGES.keys())

    async def test_categories_list_has_all_5(self) -> None:
        """CATEGORIES list contains exactly the 5 emission categories.

        Returns:
            None
        """
        assert set(CATEGORIES) == {"transport", "food", "energy", "shopping", "waste"}
        assert len(CATEGORIES) == 5
