"""Tests for all Pydantic model validation rules."""

import logging
from datetime import date, timedelta

import pytest

from app.models.activity import ActivityCreate
from app.models.goal import GoalCreate
from app.models.user import UserProfileUpdate

logger = logging.getLogger(__name__)


class TestActivityCreate:
    """Validation tests for ActivityCreate request model."""

    def test_valid_activity_passes(self) -> None:
        """ActivityCreate accepts valid input without raising.

        Returns:
            None
        """
        activity = ActivityCreate(
            category="transport",
            subcategory="car_petrol",
            amount=50.0,
            date=date.today(),
        )
        assert activity.amount == 50.0

    def test_future_date_raises_value_error(self) -> None:
        """ActivityCreate rejects a date set in the future.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="cannot be in the future"):
            ActivityCreate(
                category="transport",
                subcategory="car_petrol",
                amount=10.0,
                date=date.today() + timedelta(days=1),
            )

    def test_zero_amount_raises_value_error(self) -> None:
        """ActivityCreate rejects amount=0 (must be > 0).

        Returns:
            None
        """
        with pytest.raises(ValueError):
            ActivityCreate(
                category="transport",
                subcategory="car_petrol",
                amount=0.0,
                date=date.today(),
            )

    def test_negative_amount_raises_value_error(self) -> None:
        """ActivityCreate rejects negative amounts.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            ActivityCreate(
                category="transport",
                subcategory="car_petrol",
                amount=-5.0,
                date=date.today(),
            )

    def test_notes_max_length_enforced(self) -> None:
        """ActivityCreate rejects notes longer than 200 characters.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            ActivityCreate(
                category="food",
                subcategory="beef",
                amount=0.5,
                date=date.today(),
                notes="x" * 201,
            )

    def test_invalid_category_raises_value_error(self) -> None:
        """ActivityCreate rejects unknown category values.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            ActivityCreate(
                category="invalid_category",  # type: ignore[arg-type]
                subcategory="anything",
                amount=1.0,
                date=date.today(),
            )


class TestGoalCreate:
    """Validation tests for GoalCreate request model."""

    def test_valid_goal_passes(self) -> None:
        """GoalCreate accepts valid input without raising.

        Returns:
            None
        """
        goal = GoalCreate(
            title="Reduce transport",
            category="transport",
            target_reduction_percent=20.0,
            end_date=date.today() + timedelta(days=30),
        )
        assert goal.target_reduction_percent == 20.0

    def test_end_date_too_soon_raises_value_error(self) -> None:
        """GoalCreate rejects end_date fewer than 7 days from today.

        Returns:
            None
        """
        with pytest.raises(ValueError, match="at least 7 days"):
            GoalCreate(
                title="Short goal",
                category="food",
                target_reduction_percent=10.0,
                end_date=date.today() + timedelta(days=3),
            )

    def test_reduction_percent_zero_raises_value_error(self) -> None:
        """GoalCreate rejects target_reduction_percent=0.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            GoalCreate(
                title="Zero reduction",
                category="energy",
                target_reduction_percent=0.0,
                end_date=date.today() + timedelta(days=30),
            )

    def test_reduction_percent_over_100_raises_value_error(self) -> None:
        """GoalCreate rejects target_reduction_percent > 100.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            GoalCreate(
                title="Over limit",
                category="energy",
                target_reduction_percent=101.0,
                end_date=date.today() + timedelta(days=30),
            )


class TestUserProfileUpdate:
    """Validation tests for UserProfileUpdate request model."""

    def test_all_none_is_valid_at_model_level(self) -> None:
        """UserProfileUpdate allows all-None (route validates at least one field is set).

        Returns:
            None
        """
        update = UserProfileUpdate()
        assert update.display_name is None
        assert update.region is None

    def test_invalid_region_raises_value_error(self) -> None:
        """UserProfileUpdate rejects unknown region codes.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            UserProfileUpdate(region="MARS")  # type: ignore[arg-type]

    def test_invalid_diet_type_raises_value_error(self) -> None:
        """UserProfileUpdate rejects unknown diet type strings.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            UserProfileUpdate(diet_type="carnivore")  # type: ignore[arg-type]

    def test_household_size_zero_raises_value_error(self) -> None:
        """UserProfileUpdate rejects household_size=0 (minimum is 1).

        Returns:
            None
        """
        with pytest.raises(ValueError):
            UserProfileUpdate(household_size=0)

    def test_household_size_over_10_raises_value_error(self) -> None:
        """UserProfileUpdate rejects household_size > 10.

        Returns:
            None
        """
        with pytest.raises(ValueError):
            UserProfileUpdate(household_size=11)
