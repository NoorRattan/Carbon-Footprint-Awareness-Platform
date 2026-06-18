"""Education content routes.

Handles GET /api/v1/education (list) and GET /api/v1/education/{slug} (detail).
These endpoints are public — no auth required.
"""
import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/education", tags=["education"])


@router.get("")
async def list_articles() -> dict:
    """Return summary cards for all published education articles.

    Returns:
        Dict with an 'articles' key containing a list of EducationSummary objects.
    """
    logger.info("list_articles called")
    return {"articles": []}


@router.get("/{slug}")
async def get_article(slug: str) -> dict:
    """Return the full content for a single education article.

    Args:
        slug: URL-safe article identifier matching the Firestore document ID.

    Returns:
        EducationDetail with full Markdown content.
    """
    logger.info("get_article called for slug=%s", slug)
    return {}
