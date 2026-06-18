"""Pydantic models for activity logging.

Activities represent individual carbon-emitting actions logged by the user
(e.g., a car journey, a meal, home energy use). The carbon_kg field is
always calculated server-side and is never accepted from clients.
"""
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

# Literal union type for all valid activity categories
ActivityCategory = Literal["transport", "food", "energy", "shopping", "waste"]

# All valid category strings as a set — used for runtime validation in routes
VALID_CATEGORIES: frozenset[str] = frozenset(
    {"transport", "food", "energy", "shopping", "waste"}
)


class ActivityCreate(BaseModel):
    """Request body for POST /api/v1/activities.

    The client supplies category, subcategory, amount, date, and an optional
    note. The server calculates carbon_kg from the emission factors table and
    the unit label from SUBCATEGORY_CONFIG — clients never supply these values.
    """

    category: ActivityCategory = Field(..., description="Top-level emission category.")
    subcategory: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Specific subcategory key (e.g., 'car_petrol', 'beef').",
    )
    amount: float = Field(
        ...,
        gt=0,
        description="Quantity in the unit appropriate for the subcategory (km, kg, kWh, etc.).",
    )
    date: date = Field(
        ...,
        description="Date the activity occurred (ISO format YYYY-MM-DD). Must not be in the future.",
    )
    notes: str | None = Field(
        default=None,
        max_length=200,
        description="Optional user note (max 200 characters).",
    )

    @field_validator("date")
    @classmethod
    def date_not_in_future(cls, v: date) -> date:
        """Validate that the activity date is not in the future.

        Args:
            v: Date value to validate.

        Returns:
            The validated date.

        Raises:
            ValueError: If the date is in the future.
        """
        from datetime import date as date_type

        if v > date_type.today():
            raise ValueError("Activity date cannot be in the future.")
        return v


class ActivityResponse(BaseModel):
    """Response body for a single activity — returned by POST and included in GET list."""

    id: str = Field(..., description="Firestore document ID.")
    category: ActivityCategory
    subcategory: str
    amount: float
    unit: str = Field(..., description="Unit label (e.g., 'km', 'kg', 'kWh', 'items').")
    carbon_kg: float = Field(..., description="Calculated CO₂e in kilograms.")
    date: str = Field(..., description="Activity date in ISO format YYYY-MM-DD.")
    notes: str | None = None
    created_at: str = Field(..., description="ISO 8601 timestamp when the log entry was created.")


class ActivitiesListResponse(BaseModel):
    """Response body for GET /api/v1/activities."""

    activities: list[ActivityResponse]
    total: int = Field(..., description="Total number of activities in the response.")


class CategoryTotals(BaseModel):
    """Per-category carbon totals — part of ActivitiesSummary."""

    transport: float = 0.0
    food: float = 0.0
    energy: float = 0.0
    shopping: float = 0.0
    waste: float = 0.0


class PeriodBounds(BaseModel):
    """Date range for a summary query."""

    start: str = Field(..., description="Start date in ISO format YYYY-MM-DD.")
    end: str = Field(..., description="End date in ISO format YYYY-MM-DD.")


class ActivitiesSummary(BaseModel):
    """Response body for GET /api/v1/activities/summary.

    Returns aggregated carbon totals by category for a given date range.
    Used by the frontend Dashboard and recommendation engine to calculate
    the user's category breakdown.
    """

    total_carbon_kg: float = Field(..., description="Total CO₂e across all categories.")
    by_category: CategoryTotals = Field(
        ..., description="Carbon totals broken down by category."
    )
    period: PeriodBounds = Field(..., description="Date range covered by this summary.")
