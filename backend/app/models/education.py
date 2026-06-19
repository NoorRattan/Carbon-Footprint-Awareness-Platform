"""Pydantic models for the education content feature.

EcoTrack includes 5 seeded education articles (one per category) that
help users understand what contributes to their carbon footprint and
what actions have the most impact. Articles are stored in Firestore
and seeded via backend/seed_data.py.
"""

from typing import Literal

from pydantic import BaseModel, Field

EducationCategory = Literal["transport", "food", "energy", "shopping", "waste", "general"]


class EducationSummary(BaseModel):
    """Summary card returned in the GET /api/v1/education list.

    Includes metadata but not the full article content, keeping the
    list response lightweight.
    """

    slug: str = Field(..., description="URL-safe identifier matching the Firestore document ID.")
    title: str = Field(..., description="Article title.")
    category: EducationCategory = Field(..., description="Emission category covered.")
    read_time: int = Field(..., ge=1, le=60, description="Estimated reading time in minutes.")
    updated_at: str = Field(..., description="ISO 8601 timestamp of last content update.")


class EducationDetail(EducationSummary):
    """Full article response returned by GET /api/v1/education/{slug}.

    Extends EducationSummary by adding the full Markdown content body.
    """

    content: str = Field(
        ...,
        description=(
            "Full article content in Markdown format. Rendered on the frontend with react-markdown."
        ),
    )
