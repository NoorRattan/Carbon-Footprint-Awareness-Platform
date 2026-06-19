"""Pydantic models for user profile.

UserProfile represents the persisted user document in Firestore.
UserProfileUpdate is used for PATCH-style updates — all fields optional.
"""

from typing import Literal

from pydantic import BaseModel, Field

# Literal union types — these drive validation and are reused in Firestore service
UserRegion = Literal["UK", "US", "EU", "IN", "AU", "OTHER"]
DietType = Literal["meat-heavy", "average", "vegetarian", "vegan"]

VALID_REGIONS: frozenset[str] = frozenset({"UK", "US", "EU", "IN", "AU", "OTHER"})
VALID_DIET_TYPES: frozenset[str] = frozenset({"meat-heavy", "average", "vegetarian", "vegan"})


class UserProfile(BaseModel):
    """Full user profile returned by GET /api/v1/user/profile.

    This is the complete view of the user document from Firestore,
    with all camelCase Firestore fields mapped to snake_case here
    by firestore_service.py.
    """

    uid: str = Field(..., description="Firebase Auth UID.")
    email: str = Field(..., description="User email address from Firebase Auth.")
    display_name: str = Field(..., description="Display name from Firebase Auth or user-set.")
    region: UserRegion = Field(
        default="OTHER",
        description="User's country/region — determines national average and electricity factors.",
    )
    diet_type: DietType = Field(
        default="average",
        description="Diet type — used for food activity pre-fill suggestions.",
    )
    household_size: int = Field(
        default=1,
        ge=1,
        le=10,
        description="Number of people in household (1–10).",
    )
    created_at: str = Field(..., description="ISO 8601 timestamp of first login.")
    streak: int = Field(
        default=0, ge=0, description="Consecutive days with at least one activity logged."
    )
    badges: list[str] = Field(
        default_factory=list, description="List of achievement badge IDs earned."
    )


class UserProfileUpdate(BaseModel):
    """Request body for PUT /api/v1/user/profile.

    All fields are optional — at least one must be provided (validated in the route).
    """

    display_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="New display name.",
    )
    region: UserRegion | None = Field(
        default=None, description="New region (UK, US, EU, IN, AU, or OTHER)."
    )
    diet_type: DietType | None = Field(default=None, description="New diet type.")
    household_size: int | None = Field(
        default=None, ge=1, le=10, description="New household size (1–10)."
    )
