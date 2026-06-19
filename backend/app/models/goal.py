"""Pydantic models for carbon reduction goals.

Goals allow users to commit to specific reduction targets for a category
over a defined time period. Baseline and target carbon values are calculated
server-side at goal creation time.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

# Goals can target a specific category or total footprint
GoalCategory = Literal["transport", "food", "energy", "shopping", "waste", "total"]
GoalStatus = Literal["active", "completed", "failed"]


class GoalCreate(BaseModel):
    """Request body for POST /api/v1/goals.

    baseline_carbon_kg and target_carbon_kg are calculated server-side
    from the last 30 days of activity data for the given category.
    """

    title: str = Field(..., min_length=1, max_length=100, description="User-written goal title.")
    category: GoalCategory = Field(
        ..., description="Category to reduce, or 'total' for overall footprint."
    )
    target_reduction_percent: float = Field(
        ...,
        gt=0,
        le=100,
        description="Target percentage reduction (1–100).",
    )
    end_date: date = Field(
        ...,
        description="Goal end date. Must be at least 7 days from today.",
    )

    @field_validator("end_date")
    @classmethod
    def end_date_at_least_7_days_away(cls, v: date) -> date:
        """Validate that end_date is at least 7 days in the future.

        Args:
            v: The end_date value.

        Returns:
            Validated end_date.

        Raises:
            ValueError: If end_date is fewer than 7 days from today.
        """
        from datetime import date as date_type
        from datetime import timedelta

        if v < date_type.today() + timedelta(days=7):
            raise ValueError("Goal end_date must be at least 7 days in the future.")
        return v


class GoalResponse(BaseModel):
    """Full goal object returned by GET /api/v1/goals and POST /api/v1/goals."""

    id: str = Field(..., description="Firestore document ID.")
    title: str
    category: GoalCategory
    target_reduction_percent: float
    baseline_carbon_kg: float = Field(
        ...,
        description="User's carbon_kg for this category at the time the goal was created.",
    )
    target_carbon_kg: float = Field(
        ...,
        description="Calculated target: baseline * (1 - reduction_percent / 100).",
    )
    start_date: str = Field(..., description="ISO date string — the goal creation date.")
    end_date: str = Field(..., description="ISO date string — the goal target date.")
    status: GoalStatus = Field(default="active")
    created_at: str = Field(..., description="ISO 8601 timestamp of goal creation.")


class GoalUpdate(BaseModel):
    """Request body for PUT /api/v1/goals/{id}.

    All fields optional — at least one must be provided.
    """

    title: str | None = Field(default=None, min_length=1, max_length=100)
    end_date: date | None = Field(default=None)
    status: GoalStatus | None = Field(default=None)
