"""Personalised carbon recommendation engine for EcoTrack.

Analyses the user's last 30 days of activity data, compares their footprint
to their regional national average, and generates ranked actionable
recommendations sorted by estimated annual CO₂e saving.

This engine is intentionally data-driven — every recommendation includes
specific numbers derived from the user's actual activity history, not
generic advice. The 9-rule system evaluates by_subcategory totals (not just
by_category) to produce recommendations that reference the user's exact
usage patterns.

Called by: GET /api/v1/insights (via firestore_service cache layer)
"""

import logging
from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

from app.models.insight import InsightResponse, Recommendation
from app.models.user import UserProfile
from app.services.carbon_calculator import NATIONAL_AVERAGES

logger = logging.getLogger(__name__)

CATEGORIES: list[str] = ["transport", "food", "energy", "shopping", "waste"]

BADGES: dict[str, str] = {
    "first_log": "Logged your first activity",
    "week_streak": "7-day logging streak",
    "month_streak": "30-day logging streak",
    "below_average": "Footprint below national average",
    "carbon_cutter": "Reduced monthly footprint by 10%+",
    "green_champion": "Reduced monthly footprint by 25%+",
    "goal_setter": "Created your first reduction goal",
    "goal_achiever": "Completed a reduction goal",
    "low_transport": "Transport footprint under 50 kg this month",
    "plant_powered": "No meat logged in 7 days",
}


async def generate_insights(
    uid: str,
    activities_current: list[dict[str, Any]],
    activities_previous: list[dict[str, Any]],
    user_profile: UserProfile,
) -> InsightResponse:
    """Generate personalised carbon insights and recommendations for a user.

    Analyses the last 30 days of activity data (activities_current) and the
    preceding 30 days (activities_previous) to calculate footprint trends,
    compare against national averages, and generate ranked recommendations.

    Args:
        uid: Firebase Auth UID of the user.
        activities_current: List of activity dicts from the last 30 days.
                            Each dict has: category, subcategory, carbon_kg, date.
        activities_previous: List of activity dicts from days 31–60 ago.
                             Used to calculate monthly_change_percent.
        user_profile: UserProfile Pydantic model with at minimum region and streak.

    Returns:
        InsightResponse Pydantic model with footprint_kg, vs_average_percent,
        top_category, monthly_change_percent, up to 5 recommendations sorted
        by estimated_saving_kg descending, earned achievement badges, and
        a generated_at ISO timestamp.
    """
    # ------------------------------------------------------------------
    # Step 1: Calculate totals from current 30-day activities
    # ------------------------------------------------------------------
    total_kg: float = sum(float(a.get("carbon_kg", 0)) for a in activities_current)

    by_category: dict[str, float] = {
        cat: sum(
            float(a.get("carbon_kg", 0)) for a in activities_current if a.get("category") == cat
        )
        for cat in CATEGORIES
    }

    by_subcategory: dict[str, float] = defaultdict(float)
    for activity in activities_current:
        subcategory = activity.get("subcategory", "")
        by_subcategory[subcategory] += float(activity.get("carbon_kg", 0))

    # ------------------------------------------------------------------
    # Step 3: Identify top category (highest CO₂e contribution)
    # ------------------------------------------------------------------
    top_category: str | None = (
        max(by_category, key=lambda k: by_category[k]) if total_kg > 0 else None
    )

    # ------------------------------------------------------------------
    # Step 4: Compare to national average using annual extrapolation
    # ------------------------------------------------------------------
    annual_estimate_kg: float = (total_kg / 30) * 365
    national_avg_kg: float = NATIONAL_AVERAGES.get(user_profile.region, 7.0) * 1000
    vs_average_percent: float = (
        ((annual_estimate_kg - national_avg_kg) / national_avg_kg) * 100
        if national_avg_kg > 0
        else 0.0
    )

    # ------------------------------------------------------------------
    # Step 5: Calculate monthly change vs previous 30-day period
    # ------------------------------------------------------------------
    previous_total_kg: float = sum(float(a.get("carbon_kg", 0)) for a in activities_previous)
    monthly_change_percent: float = (
        ((total_kg - previous_total_kg) / previous_total_kg) * 100 if previous_total_kg > 0 else 0.0
    )

    # ------------------------------------------------------------------
    # Step 6: Build template variable dict for recommendation formatting
    # ------------------------------------------------------------------
    car_kg = by_subcategory.get("car_petrol", 0.0) + by_subcategory.get("car_diesel", 0.0)
    car_pct = (
        (car_kg / by_category.get("transport", 1)) * 100
        if by_category.get("transport", 0) > 0
        else 0.0
    )
    flight_pct = (
        (
            by_subcategory.get("flight_domestic", 0.0)
            + by_subcategory.get("flight_shorthaul", 0.0)
            + by_subcategory.get("flight_longhaul", 0.0)
        )
        / total_kg
        * 100
        if total_kg > 0
        else 0.0
    )
    beef_kg = by_subcategory.get("beef", 0.0)
    meat_kg = beef_kg + by_subcategory.get("lamb", 0.0)
    elec_kg = (
        by_subcategory.get("electricity_uk", 0.0)
        + by_subcategory.get("electricity_us", 0.0)
        + by_subcategory.get("electricity_eu", 0.0)
        + by_subcategory.get("electricity_in", 0.0)
        + by_subcategory.get("electricity_au", 0.0)
    )
    heat_pct = (
        (by_subcategory.get("natural_gas", 0.0) + by_subcategory.get("heating_oil", 0.0))
        / by_category.get("energy", 1)
        * 100
        if by_category.get("energy", 0) > 0
        else 0.0
    )
    landfill_kg = by_subcategory.get("landfill", 0.0)
    landfill_carbon = landfill_kg * 0.587

    template_vars: dict[str, Any] = {
        "car_pct": car_pct,
        "car_kg": car_kg,
        "region": user_profile.region,
        "flight_pct": flight_pct,
        "beef_kg": beef_kg,
        "meat_kg": meat_kg,
        "elec_kg": elec_kg,
        "heat_pct": heat_pct,
        "landfill_kg": landfill_kg,
        "landfill_carbon": landfill_carbon,
        "saving": 0.0,  # overwritten per-rule below
    }

    # ------------------------------------------------------------------
    # Step 7: Evaluate all 9 recommendation rules
    # ------------------------------------------------------------------
    rules: list[dict[str, Any]] = [
        # --- TRANSPORT ---
        {
            "id": "switch_to_public_transport",
            "condition": (
                by_category.get("transport", 0) > 0
                and by_subcategory.get("car_petrol", 0.0) + by_subcategory.get("car_diesel", 0.0)
                > 0
            ),
            "title": "Switch to public transport for regular journeys",
            "description_template": (
                "Your car contributes {car_pct:.0f}% of your transport footprint. "
                "Replacing 3 car trips per week with bus or train saves "
                "approximately {saving:.0f} kg CO₂e per year."
            ),
            "saving_kg": (
                by_subcategory.get("car_petrol", 0.0) + by_subcategory.get("car_diesel", 0.0)
            )
            * 12
            * 0.35,
            "category": "transport",
            "difficulty": "medium",
        },
        {
            "id": "switch_to_electric_car",
            "condition": (
                by_subcategory.get("car_petrol", 0.0) + by_subcategory.get("car_diesel", 0.0) > 80
            ),
            "title": "Consider switching to an electric vehicle",
            "description_template": (
                "Your petrol/diesel car journeys produce {car_kg:.0f} kg CO₂e per month. "
                "An equivalent EV on the {region} grid would cut this by approximately 72%."
            ),
            "saving_kg": (
                by_subcategory.get("car_petrol", 0.0) + by_subcategory.get("car_diesel", 0.0)
            )
            * 12
            * 0.72,
            "category": "transport",
            "difficulty": "hard",
        },
        {
            "id": "reduce_flights",
            "condition": (
                by_subcategory.get("flight_domestic", 0.0)
                + by_subcategory.get("flight_shorthaul", 0.0)
                + by_subcategory.get("flight_longhaul", 0.0)
                > 50
            ),
            "title": "Replace one short-haul flight with train travel",
            "description_template": (
                "Aviation accounts for {flight_pct:.0f}% of your logged footprint. "
                "Swapping a 500 km flight for rail saves around 120 kg CO₂e."
            ),
            "saving_kg": 120.0,
            "category": "transport",
            "difficulty": "medium",
        },
        # --- FOOD ---
        {
            "id": "reduce_beef_weekly",
            "condition": by_subcategory.get("beef", 0.0) > 0,
            "title": "Reduce beef consumption by one meal per week",
            "description_template": (
                "Beef is your highest-impact food at {beef_kg:.1f} kg CO₂e this period. "
                "Replacing one weekly beef meal with chicken or legumes saves "
                "around {saving:.0f} kg CO₂e per year."
            ),
            "saving_kg": by_subcategory.get("beef", 0.0) * 12 * 0.25,
            "category": "food",
            "difficulty": "easy",
        },
        {
            "id": "try_plant_based_day",
            "condition": (
                by_category.get("food", 0) > 30
                and by_subcategory.get("beef", 0.0) + by_subcategory.get("lamb", 0.0) > 15
            ),
            "title": "Try one plant-based day per week",
            "description_template": (
                "Your meat consumption contributes {meat_kg:.0f} kg CO₂e per month. "
                "One meat-free day per week reduces your food footprint "
                "by approximately {saving:.0f} kg CO₂e per year."
            ),
            "saving_kg": (by_subcategory.get("beef", 0.0) + by_subcategory.get("lamb", 0.0))
            * 12
            * 0.14,
            "category": "food",
            "difficulty": "easy",
        },
        # --- ENERGY ---
        {
            "id": "switch_green_energy",
            "condition": (
                by_subcategory.get("electricity_uk", 0.0)
                + by_subcategory.get("electricity_us", 0.0)
                + by_subcategory.get("electricity_eu", 0.0)
                + by_subcategory.get("electricity_in", 0.0)
                + by_subcategory.get("electricity_au", 0.0)
                > 15
            ),
            "title": "Switch to a renewable electricity tariff",
            "description_template": (
                "Your electricity use contributes {elec_kg:.0f} kg CO₂e per month. "
                "Switching to a verified renewable tariff could reduce this "
                "by up to 95% ({saving:.0f} kg CO₂e per year)."
            ),
            "saving_kg": (
                by_subcategory.get("electricity_uk", 0.0)
                + by_subcategory.get("electricity_us", 0.0)
            )
            * 12
            * 0.95,
            "category": "energy",
            "difficulty": "easy",
        },
        {
            "id": "reduce_heating",
            "condition": (
                by_subcategory.get("natural_gas", 0.0) + by_subcategory.get("heating_oil", 0.0) > 30
            ),
            "title": "Lower thermostat by 1°C",
            "description_template": (
                "Home heating is {heat_pct:.0f}% of your energy footprint. "
                "Reducing your thermostat by just 1°C saves around 8% on "
                "heating bills and approximately {saving:.0f} kg CO₂e per year."
            ),
            "saving_kg": (
                by_subcategory.get("natural_gas", 0.0) + by_subcategory.get("heating_oil", 0.0)
            )
            * 12
            * 0.08,
            "category": "energy",
            "difficulty": "easy",
        },
        # --- SHOPPING ---
        {
            "id": "buy_secondhand",
            "condition": (
                by_category.get("shopping", 0) > 15 and by_subcategory.get("clothing_new", 0.0) > 0
            ),
            "title": "Buy second-hand clothing instead of new",
            "description_template": (
                "Each new garment you buy produces around 33 kg CO₂e. "
                "Buying second-hand reduces this by 90%, saving "
                "approximately {saving:.0f} kg CO₂e over the next year."
            ),
            "saving_kg": by_subcategory.get("clothing_new", 0.0) * 12 * 0.90,
            "category": "shopping",
            "difficulty": "easy",
        },
        # --- WASTE ---
        {
            "id": "reduce_landfill_waste",
            "condition": by_subcategory.get("landfill", 0.0) > 10,
            "title": "Reduce waste sent to landfill",
            "description_template": (
                "You sent {landfill_kg:.0f} kg to landfill, generating "
                "{landfill_carbon:.0f} kg CO₂e. Composting food waste and "
                "recycling more can cut this by approximately {saving:.0f} kg CO₂e per year."
            ),
            "saving_kg": by_subcategory.get("landfill", 0.0) * 12 * 0.40,
            "category": "waste",
            "difficulty": "easy",
        },
    ]

    # ------------------------------------------------------------------
    # Step 8: Build Recommendation objects and award badges
    # ------------------------------------------------------------------
    recommendations: list[Recommendation] = []
    for rule in rules:
        if not rule["condition"]:
            continue
        saving_kg = float(rule["saving_kg"])
        vars_with_saving = {**template_vars, "saving": saving_kg}
        try:
            description = rule["description_template"].format(**vars_with_saving)
        except KeyError as exc:
            logger.warning("Template key missing in rule %s: %s", rule["id"], exc)
            description = rule["title"]

        recommendations.append(
            Recommendation(
                id=rule["id"],
                title=rule["title"],
                description=description,
                category=rule["category"],
                estimated_saving_kg=round(max(0.0, saving_kg), 2),
                difficulty=rule["difficulty"],
            )
        )

    # Sort by estimated_saving_kg descending, keep top 5
    recommendations.sort(key=lambda r: r.estimated_saving_kg, reverse=True)
    recommendations = recommendations[:5]

    # Award badges based on current state
    earned_badges: list[str] = list(user_profile.badges)

    if activities_current:
        if "first_log" not in earned_badges:
            earned_badges.append("first_log")

    streak = user_profile.streak
    if streak >= 30 and "month_streak" not in earned_badges:
        earned_badges.append("month_streak")
    elif streak >= 7 and "week_streak" not in earned_badges:
        earned_badges.append("week_streak")

    if vs_average_percent < 0 and "below_average" not in earned_badges:
        earned_badges.append("below_average")

    if monthly_change_percent <= -25 and "green_champion" not in earned_badges:
        earned_badges.append("green_champion")
    elif monthly_change_percent <= -10 and "carbon_cutter" not in earned_badges:
        earned_badges.append("carbon_cutter")

    transport_kg = by_category.get("transport", 0.0)
    if transport_kg > 0 and transport_kg < 50 and "low_transport" not in earned_badges:
        earned_badges.append("low_transport")

    # Check plant-powered: no meat subcategories logged
    meat_subs = {"beef", "lamb", "pork", "chicken"}
    if activities_current and not any(
        a.get("subcategory") in meat_subs for a in activities_current
    ):
        if "plant_powered" not in earned_badges:
            earned_badges.append("plant_powered")

    new_achievements = [b for b in earned_badges if b not in user_profile.badges]

    logger.info(
        "Insights generated for uid=%s footprint=%.2f kg rules_fired=%d badges_new=%s",
        uid,
        total_kg,
        len(recommendations),
        new_achievements,
    )

    return InsightResponse(
        footprint_kg=round(total_kg, 2),
        vs_average_percent=round(vs_average_percent, 1),
        top_category=top_category,
        monthly_change_percent=round(monthly_change_percent, 1),
        recommendations=recommendations,
        achievements=earned_badges,
        generated_at=datetime.now(UTC).isoformat(),
    )
