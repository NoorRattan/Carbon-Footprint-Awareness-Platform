"""Pydantic models for the SmartAdvisor recommendation engine output.

InsightResponse is the complete output of generate_insights() — it
includes the user's footprint summary, personalised recommendations
ranked by estimated CO₂e saving, and earned achievement badges.
"""
from typing import Literal

from pydantic import BaseModel, Field

# Difficulty rating for each recommendation
Difficulty = Literal["easy", "medium", "hard"]


class Recommendation(BaseModel):
    """A single personalised recommendation from the Smart Advisor engine.

    Recommendations are generated dynamically based on the user's actual
    activity data — they are never static tips. Each recommendation includes
    an estimated annual CO₂e saving to allow ranking by impact.
    """

    id: str = Field(
        ...,
        description="Stable snake_case identifier (e.g., 'switch_to_public_transport').",
    )
    title: str = Field(..., description="Short human-readable recommendation title.")
    description: str = Field(
        ...,
        description=(
            "1–2 sentence explanation with specific numbers derived from "
            "the user's actual activity data."
        ),
    )
    category: str = Field(
        ..., description="The emission category this recommendation addresses."
    )
    estimated_saving_kg: float = Field(
        ...,
        ge=0,
        description="Estimated annual CO₂e saving in kg if this recommendation is followed.",
    )
    difficulty: Difficulty = Field(
        ..., description="Ease of implementation: easy, medium, or hard."
    )


class InsightResponse(BaseModel):
    """Complete output of the Smart Advisor recommendation engine.

    Returned by GET /api/v1/insights. This document is cached in Firestore
    and refreshed if the cache is older than 6 hours or explicitly requested.
    """

    footprint_kg: float = Field(
        ..., description="Total CO₂e logged in the last 30 days (kg)."
    )
    vs_average_percent: float = Field(
        ...,
        description=(
            "Percentage difference vs the user's national average, calculated from "
            "an annual extrapolation of the 30-day footprint. Negative = below average."
        ),
    )
    top_category: str | None = Field(
        default=None,
        description="The category with the highest CO₂e contribution. None if no activities logged.",
    )
    monthly_change_percent: float = Field(
        default=0.0,
        description=(
            "Percentage change vs the previous 30-day period. "
            "Negative = footprint decreased (good)."
        ),
    )
    recommendations: list[Recommendation] = Field(
        default_factory=list,
        description=(
            "Up to 5 personalised recommendations sorted by estimated_saving_kg descending. "
            "Empty list if no activities have been logged."
        ),
    )
    achievements: list[str] = Field(
        default_factory=list,
        description="Badge IDs earned by the user based on their progress.",
    )
    generated_at: str = Field(
        ..., description="ISO 8601 timestamp when these insights were generated."
    )
