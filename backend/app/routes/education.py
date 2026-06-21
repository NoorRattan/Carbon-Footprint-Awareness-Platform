"""Education content routes.

Handles GET /api/v1/education (list), GET /api/v1/education/{slug} (detail),
and POST /api/v1/calculate (public carbon calculator).

These endpoints are public — no auth required. The /calculate endpoint has a
stricter rate limit of 30/minute per IP to prevent abuse.
"""

import logging
import re

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.limiter import limiter
from app.models.education import EducationDetail, EducationSummary
from app.services.carbon_calculator import (
    SUBCATEGORY_LABELS,
    VALID_SUBCATEGORIES,
    calculate_carbon,
    get_unit_label,
)
from app.services.firestore_service import get_education, get_education_by_slug

logger = logging.getLogger(__name__)

router = APIRouter(tags=["education"])

SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9-]+$")

VALID_CATEGORIES = frozenset({"transport", "food", "energy", "shopping", "waste"})


class CalculateRequest(BaseModel):
    """Request body for POST /api/v1/calculate."""

    category: str = Field(..., description="Top-level emission category.")
    subcategory: str = Field(..., description="Specific subcategory key.")
    amount: float = Field(..., description="Quantity in the unit for the subcategory.")


class CalculateResponse(BaseModel):
    """Response body for POST /api/v1/calculate."""

    carbon_kg: float = Field(..., description="Calculated CO\u2082e in kilograms.")
    unit: str = Field(..., description="Unit label used for this subcategory.")
    description: str = Field(..., description="Human-readable summary of the calculation.")


@router.get("/education", response_model=dict)
@limiter.limit("60/minute")
async def list_articles(request: Request, category: str | None = None) -> dict:
    """Return summary cards for all published education articles.

    This endpoint is public — no authentication required.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        category: Optional category filter.

    Returns:
        Dict with an 'articles' key containing a list of EducationSummary objects.
    """
    articles_data = await get_education(category)
    articles = [EducationSummary(**a).model_dump() for a in articles_data]
    logger.info("list_articles returned %d articles", len(articles))
    return {"articles": articles}


@router.get("/education/{slug}", response_model=EducationDetail)
@limiter.limit("60/minute")
async def get_article(request: Request, slug: str) -> EducationDetail:
    """Return the full content for a single education article identified by slug.

    Slug is validated against a strict alphanumeric-and-hyphens pattern before
    any Firestore query to prevent injection. Returns 400 on invalid slug
    characters and 404 when the article does not exist or is unpublished.

    This endpoint is public — no authentication required.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        slug: URL-safe article identifier (alphanumeric characters and hyphens only).

    Returns:
        EducationDetail with full Markdown content on success.
    """
    if not SLUG_PATTERN.match(slug):
        raise HTTPException(status_code=400, detail="Invalid slug format.")

    article = await get_education_by_slug(slug)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found.")

    logger.info("get_article slug=%s", slug)
    return EducationDetail(**article)


@router.post("/calculate", response_model=CalculateResponse)
@limiter.limit("30/minute")
async def calculate(request: Request, body: CalculateRequest) -> CalculateResponse:
    """Calculate the carbon footprint for a given activity without authentication.

    Validates category and subcategory against the emission factor table, then
    calculates and returns carbon_kg, the unit label, and a human-readable
    description. Rate-limited to 30 requests per minute per IP.

    This endpoint is public — no authentication required.

    Args:
        request: Incoming HTTP request (required by slowapi rate limiter).
        body: CalculateRequest with category, subcategory, and amount.

    Returns:
        CalculateResponse with carbon_kg, unit, and a description string.
    """
    if body.category not in VALID_CATEGORIES:
        valid_str = ", ".join(sorted(VALID_CATEGORIES))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {valid_str}",
        )

    valid_subs = VALID_SUBCATEGORIES.get(body.category, frozenset())
    if body.subcategory not in valid_subs:
        valid_str = ", ".join(sorted(valid_subs))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid subcategory '{body.subcategory}' for category '{body.category}'. "
            f"Valid subcategories: {valid_str}",
        )

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than zero.")

    carbon_kg = calculate_carbon(body.category, body.subcategory, body.amount)
    unit = get_unit_label(body.category, body.subcategory)
    label = SUBCATEGORY_LABELS.get(body.subcategory, body.subcategory)
    description = f"{label} of {body.amount} {unit}"

    logger.info(
        "calculate category=%s subcategory=%s amount=%s carbon_kg=%.4f",
        body.category,
        body.subcategory,
        body.amount,
        carbon_kg,
    )
    return CalculateResponse(carbon_kg=carbon_kg, unit=unit, description=description)
