"""Re-exports all Pydantic model classes from the models package."""

from app.models.activity import (
    ActivitiesListResponse,
    ActivitiesSummary,
    ActivityCategory,
    ActivityCreate,
    ActivityResponse,
    CategoryTotals,
)
from app.models.education import EducationDetail, EducationSummary
from app.models.goal import GoalCategory, GoalCreate, GoalResponse, GoalStatus, GoalUpdate
from app.models.insight import (
    Difficulty,
    InsightResponse,
    Recommendation,
)
from app.models.user import UserProfile, UserProfileUpdate

__all__ = [
    "ActivityCategory",
    "ActivityCreate",
    "ActivityResponse",
    "ActivitiesListResponse",
    "ActivitiesSummary",
    "CategoryTotals",
    "UserProfile",
    "UserProfileUpdate",
    "GoalCategory",
    "GoalCreate",
    "GoalResponse",
    "GoalStatus",
    "GoalUpdate",
    "Difficulty",
    "Recommendation",
    "InsightResponse",
    "EducationSummary",
    "EducationDetail",
]
