"""EcoTrack backend services package.

This package contains all business logic separated from HTTP routing:
- carbon_calculator: emission factor lookup and CO₂e calculation
- recommendation_engine: personalised insight and recommendation generation
- firestore_service: all Firestore read/write operations
- auth_service: Firebase token sync and user creation helpers
"""
from app.services.carbon_calculator import (
    EMISSION_FACTORS,
    NATIONAL_AVERAGES,
    SUBCATEGORY_LABELS,
    VALID_SUBCATEGORIES,
    calculate_carbon,
    get_unit_label,
)
from app.services.firestore_service import (
    create_goal,
    delete_activity,
    delete_goal,
    delete_user_data,
    get_activities,
    get_activities_summary,
    get_db,
    get_education,
    get_education_by_slug,
    get_goals,
    get_insights,
    get_user,
    log_activity,
    save_insights,
    update_goal,
    update_user,
    upsert_user,
)
from app.services.recommendation_engine import generate_insights

__all__ = [
    "EMISSION_FACTORS",
    "NATIONAL_AVERAGES",
    "SUBCATEGORY_LABELS",
    "VALID_SUBCATEGORIES",
    "calculate_carbon",
    "get_unit_label",
    "get_db",
    "get_user",
    "upsert_user",
    "update_user",
    "delete_user_data",
    "log_activity",
    "get_activities",
    "delete_activity",
    "get_activities_summary",
    "create_goal",
    "get_goals",
    "update_goal",
    "delete_goal",
    "get_insights",
    "save_insights",
    "get_education",
    "get_education_by_slug",
    "generate_insights",
]
