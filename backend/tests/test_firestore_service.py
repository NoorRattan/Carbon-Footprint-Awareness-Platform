"""Unit tests for the Firestore service data access layer.

Tests all CRUD operations, aggregations, private mapping helpers, and helper functions
by mocking the google.cloud.firestore.AsyncClient and matching returns.
"""

from datetime import date, timedelta
from unittest.mock import AsyncMock, MagicMock

import google.cloud.firestore
import pytest

from app.services.firestore_service import (
    _ts_to_str,
    acknowledge_recommendation,
    create_goal,
    delete_activity,
    delete_goal,
    delete_user_data,
    get_activities,
    get_activities_summary,
    get_activity_by_id,
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


class AsyncMockIterator:
    """Async iterator stub to simulate Firestore query stream results."""

    def __init__(self, items):
        self.items = items
        self.iter = iter(items)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.iter)
        except StopIteration:
            raise StopAsyncIteration from None


@pytest.fixture
def mock_db(mocker):
    """Fixture to mock the get_db singleton function."""
    db_mock = MagicMock()
    mocker.patch("app.services.firestore_service.get_db", return_value=db_mock)
    return db_mock


def test_ts_to_str() -> None:
    """Tests private _ts_to_str helper under various input types."""
    assert _ts_to_str("2026-05-01T12:00:00Z") == "2026-05-01T12:00:00Z"

    class MockTimestamp:
        def isoformat(self):
            return "2026-05-01T12:00:00+00:00"

    assert _ts_to_str(MockTimestamp()) == "2026-05-01T12:00:00+00:00"
    assert _ts_to_str(123456) == "123456"


def test_get_db_singleton(mocker) -> None:
    """Tests get_db initializes the client once."""
    mocker.patch("app.services.firestore_service._db", None)
    client = get_db()
    assert client is not None


@pytest.mark.asyncio
async def test_get_user_not_found(mock_db) -> None:
    """get_user returns None if user doc is missing."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await get_user("missing-uid") is None


@pytest.mark.asyncio
async def test_get_user_success(mock_db) -> None:
    """get_user returns parsed user dict on success."""
    snapshot_mock = MagicMock(exists=True, id="user-123")
    snapshot_mock.to_dict.return_value = {
        "email": "test@example.com",
        "displayName": "Test User",
        "region": "UK",
        "dietType": "vegan",
        "householdSize": 2,
        "createdAt": "2026-01-01T00:00:00Z",
        "streak": 5,
        "badges": ["goal_setter"],
        "totalCarbonKg": 150.0,
        "monthlyTotals": {"2026-05": 30.0},
        "lastLogDate": "2026-05-01",
        "lastSeen": "2026-05-01T12:00:00Z",
    }
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await get_user("user-123")
    assert res is not None
    assert res["uid"] == "user-123"
    assert res["email"] == "test@example.com"
    assert res["display_name"] == "Test User"
    assert res["region"] == "UK"
    assert res["diet_type"] == "vegan"
    assert res["household_size"] == 2
    assert res["streak"] == 5
    assert res["badges"] == ["goal_setter"]
    assert res["total_carbon_kg"] == 150.0
    assert res["monthly_totals"] == {"2026-05": 30.0}
    assert res["last_log_date"] == "2026-05-01"
    assert res["last_seen"] == "2026-05-01T12:00:00Z"


@pytest.mark.asyncio
async def test_upsert_user_new(mock_db) -> None:
    """upsert_user creates new user profile document with default fields."""
    snapshot_mock = MagicMock(exists=False)
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    doc_mock.set = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock

    await upsert_user("new-uid", email="new@example.com", display_name="New User")

    doc_mock.set.assert_called_once()
    called_data = doc_mock.set.call_args[0][0]
    assert called_data["email"] == "new@example.com"
    assert called_data["displayName"] == "New User"
    assert called_data["region"] == "OTHER"
    assert called_data["dietType"] == "average"
    assert called_data["householdSize"] == 1
    assert called_data["streak"] == 0
    assert called_data["badges"] == []
    assert called_data["totalCarbonKg"] == 0.0
    assert called_data["monthlyTotals"] == {}
    assert "createdAt" in called_data
    assert doc_mock.set.call_args[1].get("merge") is True


@pytest.mark.asyncio
async def test_upsert_user_existing(mock_db) -> None:
    """upsert_user merges updates without adding default values for existing users."""
    snapshot_mock = MagicMock(exists=True)
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    doc_mock.set = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock

    await upsert_user("exist-uid", email="exist@example.com", display_name="Exist User")

    doc_mock.set.assert_called_once()
    called_data = doc_mock.set.call_args[0][0]
    assert called_data["email"] == "exist@example.com"
    assert called_data["displayName"] == "Exist User"
    assert "region" not in called_data


@pytest.mark.asyncio
async def test_update_user(mock_db) -> None:
    """update_user calls the document update method with mapped camelCase fields."""
    doc_mock = MagicMock()
    doc_mock.update = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock

    updates = {"display_name": "Updated Name", "region": "US"}
    await update_user("user-123", updates)

    doc_mock.update.assert_called_once_with({"displayName": "Updated Name", "region": "US"})


@pytest.mark.asyncio
async def test_delete_user_data(mock_db) -> None:
    """delete_user_data deletes subcollection documents and parent user documents."""
    act_ref = MagicMock()
    act_ref.delete = AsyncMock()
    act_snap = MagicMock(reference=act_ref)

    goal_ref = MagicMock()
    goal_ref.delete = AsyncMock()
    goal_snap = MagicMock(reference=goal_ref)

    coll_activities = MagicMock()
    coll_goals = MagicMock()
    coll_insights = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "goals":
            return coll_goals
        if name == "insights":
            return coll_insights
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    coll_activities.where.return_value.stream = lambda: AsyncMockIterator([act_snap])
    coll_goals.where.return_value.stream = lambda: AsyncMockIterator([goal_snap])

    insights_doc = MagicMock()
    insights_doc.delete = AsyncMock()
    coll_insights.document.return_value = insights_doc

    users_doc = MagicMock()
    users_doc.delete = AsyncMock()
    coll_users.document.return_value = users_doc

    await delete_user_data("user-123")

    act_ref.delete.assert_called_once()
    goal_ref.delete.assert_called_once()
    insights_doc.delete.assert_called_once()
    users_doc.delete.assert_called_once()


@pytest.mark.asyncio
async def test_log_activity_success_increment_streak(mock_db) -> None:
    """log_activity logs activity, updates monthly totals.

    Increments streak if user logged yesterday.
    """
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    doc_ref_mock = MagicMock(id="act-new")
    coll_activities.add = AsyncMock(return_value=(None, doc_ref_mock))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {
        "monthlyTotals": {"2026-05": 10.0},
        "totalCarbonKg": 50.0,
        "streak": 3,
        "lastLogDate": (date.today() - timedelta(days=1)).isoformat(),
    }
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    res = await log_activity(
        uid="user-123",
        category="transport",
        subcategory="car_petrol",
        amount=100.0,
        unit="km",
        carbon_kg=19.2,
        date_str="2026-05-01",
        notes="commute",
    )

    assert res["id"] == "act-new"
    assert user_doc_mock.update.call_count == 2  # monthly totals update + streak update

    # Verify streak incremented to 4
    streak_call = user_doc_mock.update.call_args_list[1][0][0]
    assert streak_call["streak"] == 4


@pytest.mark.asyncio
async def test_log_activity_success_streak_today(mock_db) -> None:
    """log_activity logs activity, but leaves streak unchanged if user already logged today."""
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    doc_ref_mock = MagicMock(id="act-new")
    coll_activities.add = AsyncMock(return_value=(None, doc_ref_mock))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {
        "monthlyTotals": {},
        "totalCarbonKg": 0.0,
        "streak": 3,
        "lastLogDate": date.today().isoformat(),
    }
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    await log_activity(
        uid="user-123",
        category="transport",
        subcategory="car_petrol",
        amount=100.0,
        unit="km",
        carbon_kg=19.2,
        date_str=date.today().isoformat(),
        notes=None,
    )

    # Only monthly totals is updated, streak update is skipped
    assert user_doc_mock.update.call_count == 1


@pytest.mark.asyncio
async def test_log_activity_success_reset_streak(mock_db) -> None:
    """log_activity resets streak to 1 if last login was several days ago."""
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    doc_ref_mock = MagicMock(id="act-new")
    coll_activities.add = AsyncMock(return_value=(None, doc_ref_mock))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {
        "monthlyTotals": {},
        "totalCarbonKg": 0.0,
        "streak": 10,
        "lastLogDate": (date.today() - timedelta(days=5)).isoformat(),
    }
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    await log_activity(
        uid="user-123",
        category="transport",
        subcategory="car_petrol",
        amount=100.0,
        unit="km",
        carbon_kg=19.2,
        date_str="2026-05-01",
        notes=None,
    )

    # Streak should reset to 1
    streak_call = user_doc_mock.update.call_args_list[1][0][0]
    assert streak_call["streak"] == 1


@pytest.mark.asyncio
async def test_log_activity_user_not_found(mock_db) -> None:
    """log_activity skips user state updates if user document is missing."""
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    coll_activities.add = AsyncMock(return_value=(None, MagicMock(id="act-1")))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=False)
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    coll_users.document.return_value = user_doc_mock

    # Completes without exception
    res = await log_activity(
        "user-123", "transport", "car_petrol", 10.0, "km", 1.9, "2026-05-01", None
    )
    assert res["id"] == "act-1"


@pytest.mark.asyncio
async def test_get_activities(mock_db) -> None:
    """get_activities filters and returns activities stream."""
    coll_mock = MagicMock()
    query_mock = MagicMock()
    query_mock.where.return_value = query_mock
    query_mock.order_by.return_value = query_mock
    query_mock.limit.return_value = query_mock

    act_snap = MagicMock(id="act-1")
    act_snap.to_dict.return_value = {
        "userId": "user-123",
        "category": "transport",
        "subcategory": "car_petrol",
        "amount": 10.0,
        "unit": "km",
        "carbonKg": 1.9,
        "date": "2026-05-01",
        "createdAt": "2026-05-01T12:00:00Z",
    }
    query_mock.stream = lambda: AsyncMockIterator([act_snap])
    coll_mock.where.return_value = query_mock
    mock_db.collection.return_value = coll_mock

    # With category filter
    res = await get_activities("user-123", "2026-05-01", "2026-05-07", "transport", limit=5)
    assert len(res) == 1
    assert res[0]["id"] == "act-1"

    # Without category filter
    res = await get_activities("user-123", "2026-05-01", "2026-05-07", None)
    assert len(res) == 1


@pytest.mark.asyncio
async def test_delete_activity_not_found(mock_db) -> None:
    """delete_activity returns None if target activity does not exist."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await delete_activity("user-123", "missing-act") is None


@pytest.mark.asyncio
async def test_delete_activity_success(mock_db) -> None:
    """delete_activity deletes document and updates user totals (subtracts carbon)."""
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    doc_mock = MagicMock()
    act_snap = MagicMock(exists=True, id="act-1")
    act_snap.to_dict.return_value = {
        "userId": "user-123",
        "category": "transport",
        "subcategory": "car_petrol",
        "amount": 10.0,
        "unit": "km",
        "carbonKg": 1.9,
        "date": "2026-05-01",
    }
    doc_mock.get = AsyncMock(return_value=act_snap)
    doc_mock.delete = AsyncMock()
    coll_activities.document.return_value = doc_mock

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {
        "monthlyTotals": {"2026-05": 10.0},
        "totalCarbonKg": 50.0,
    }
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    res = await delete_activity("user-123", "act-1")
    assert res is not None
    assert res["id"] == "act-1"
    doc_mock.delete.assert_called_once()

    # Validate subtraction
    user_doc_mock.update.assert_called_once()
    called_data = user_doc_mock.update.call_args[0][0]
    assert called_data["totalCarbonKg"] == pytest.approx(48.1)  # 50 - 1.9
    assert called_data["monthlyTotals"]["2026-05"] == pytest.approx(8.1)  # 10 - 1.9


@pytest.mark.asyncio
async def test_get_activity_by_id_not_found(mock_db) -> None:
    """get_activity_by_id returns None if target activity is missing."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await get_activity_by_id("missing-act") is None


@pytest.mark.asyncio
async def test_get_activity_by_id_success(mock_db) -> None:
    """get_activity_by_id returns mapped activity if found."""
    doc_mock = MagicMock()
    act_snap = MagicMock(exists=True, id="act-1")
    act_snap.to_dict.return_value = {
        "userId": "user-123",
        "category": "transport",
        "subcategory": "car_petrol",
        "amount": 10.0,
        "unit": "km",
        "carbonKg": 1.9,
        "date": "2026-05-01",
    }
    doc_mock.get = AsyncMock(return_value=act_snap)
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await get_activity_by_id("act-1")
    assert res is not None
    assert res["id"] == "act-1"


@pytest.mark.asyncio
async def test_get_activities_summary(mock_db) -> None:
    """get_activities_summary aggregates carbon totals by category."""
    query_mock = MagicMock()
    query_mock.where.return_value = query_mock

    snap1 = MagicMock()
    snap1.to_dict.return_value = {"category": "transport", "carbonKg": 10.0}
    snap2 = MagicMock()
    snap2.to_dict.return_value = {"category": "food", "carbonKg": 5.2}
    snap3 = MagicMock()
    snap3.to_dict.return_value = {"category": "transport", "carbonKg": 3.1}

    query_mock.stream = lambda: AsyncMockIterator([snap1, snap2, snap3])
    mock_db.collection.return_value = query_mock

    res = await get_activities_summary("user-123", "2026-05-01", "2026-05-07")
    assert res["total_carbon_kg"] == 18.3
    assert res["by_category"]["transport"] == 13.1
    assert res["by_category"]["food"] == 5.2
    assert res["by_category"]["energy"] == 0.0


@pytest.mark.asyncio
async def test_create_goal_success_award_badge(mock_db) -> None:
    """create_goal writes goal document and awards goal_setter badge if not present."""
    coll_goals = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "goals":
            return coll_goals
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    coll_goals.add = AsyncMock(return_value=(None, MagicMock(id="goal-1")))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {"badges": []}
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    res = await create_goal(
        uid="user-123",
        title="Reduce Transport",
        category="transport",
        target_reduction_percent=20.0,
        baseline_carbon_kg=100.0,
        target_carbon_kg=80.0,
        start_date="2026-05-01",
        end_date="2026-06-01",
    )

    assert res["id"] == "goal-1"
    user_doc_mock.update.assert_called_once_with({"badges": ["goal_setter"]})


@pytest.mark.asyncio
async def test_create_goal_success_already_has_badge(mock_db) -> None:
    """create_goal writes goal but skips badge if user already has goal_setter."""
    coll_goals = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "goals":
            return coll_goals
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    coll_goals.add = AsyncMock(return_value=(None, MagicMock(id="goal-1")))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {"badges": ["goal_setter"]}
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    await create_goal(
        uid="user-123",
        title="Reduce Transport",
        category="transport",
        target_reduction_percent=20.0,
        baseline_carbon_kg=100.0,
        target_carbon_kg=80.0,
        start_date="2026-05-01",
        end_date="2026-06-01",
    )

    user_doc_mock.update.assert_not_called()


@pytest.mark.asyncio
async def test_get_goals(mock_db) -> None:
    """get_goals filters and returns goals ordered by created_at DESC."""
    query_mock = MagicMock()
    query_mock.where.return_value = query_mock

    snap1 = MagicMock(id="goal-1")
    snap1.to_dict.return_value = {
        "userId": "user-123",
        "createdAt": "2026-05-01T12:00:00Z",
        "status": "active",
    }
    snap2 = MagicMock(id="goal-2")
    snap2.to_dict.return_value = {
        "userId": "user-123",
        "createdAt": "2026-05-02T12:00:00Z",
        "status": "active",
    }

    query_mock.stream = lambda: AsyncMockIterator([snap1, snap2])
    mock_db.collection.return_value = query_mock

    res = await get_goals("user-123", status="active")
    assert len(res) == 2
    assert res[0]["id"] == "goal-2"  # Newest first
    assert res[1]["id"] == "goal-1"


@pytest.mark.asyncio
async def test_update_goal_not_found(mock_db) -> None:
    """update_goal returns None if target goal is missing."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await update_goal("user-123", "missing-goal", {"title": "New"})
    assert res is None


@pytest.mark.asyncio
async def test_update_goal_success(mock_db) -> None:
    """update_goal updates goal document and returns the original document."""
    doc_mock = MagicMock()
    snapshot_mock = MagicMock(exists=True, id="goal-1")
    snapshot_mock.to_dict.return_value = {
        "userId": "user-123",
        "title": "Old Title",
        "category": "total",
        "targetReductionPercent": 10.0,
        "createdAt": "2026-05-01T12:00:00Z",
    }
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    doc_mock.update = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await update_goal(
        "user-123",
        "goal-1",
        {"title": "New Title", "target_reduction_percent": 15.0, "end_date": "2026-07-01"},
    )
    assert res is not None
    assert res["title"] == "Old Title"  # returns original
    doc_mock.update.assert_called_once_with(
        {"title": "New Title", "targetReductionPercent": 15.0, "endDate": "2026-07-01"}
    )


@pytest.mark.asyncio
async def test_delete_goal_not_found(mock_db) -> None:
    """delete_goal returns None if target goal is missing."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await delete_goal("user-123", "missing-goal") is None


@pytest.mark.asyncio
async def test_delete_goal_success(mock_db) -> None:
    """delete_goal deletes document and returns the deleted goal data."""
    doc_mock = MagicMock()
    snapshot_mock = MagicMock(exists=True, id="goal-1")
    snapshot_mock.to_dict.return_value = {"userId": "user-123", "title": "Delete Me"}
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    doc_mock.delete = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await delete_goal("user-123", "goal-1")
    assert res is not None
    assert res["title"] == "Delete Me"
    doc_mock.delete.assert_called_once()


@pytest.mark.asyncio
async def test_get_insights_not_found(mock_db) -> None:
    """get_insights returns None if user insights are missing."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await get_insights("user-123") is None


@pytest.mark.asyncio
async def test_get_insights_success(mock_db) -> None:
    """get_insights returns parsed insights dict on success."""
    snapshot_mock = MagicMock(exists=True)
    snapshot_mock.to_dict.return_value = {
        "footprintKg": 100.0,
        "vsAveragePercent": -15.0,
        "topCategory": "transport",
        "monthlyChangePercent": 5.0,
        "recommendations": [
            {
                "id": "rec-1",
                "title": "Title",
                "description": "Desc",
                "category": "transport",
                "estimatedSavingKg": 20.0,
                "difficulty": "easy",
            }
        ],
        "achievements": ["first_log"],
        "generatedAt": "2026-05-01T12:00:00Z",
    }
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await get_insights("user-123")
    assert res is not None
    assert res["footprint_kg"] == 100.0
    assert res["vs_average_percent"] == -15.0
    assert res["top_category"] == "transport"
    assert res["monthly_change_percent"] == 5.0
    assert res["achievements"] == ["first_log"]
    assert res["generated_at"] == "2026-05-01T12:00:00Z"
    assert res["recommendations"][0]["estimated_saving_kg"] == 20.0


@pytest.mark.asyncio
async def test_save_insights(mock_db) -> None:
    """save_insights overwrites the user insights document with mapped fields."""
    doc_mock = MagicMock()
    doc_mock.set = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock

    insight_data = {
        "footprint_kg": 100.0,
        "vs_average_percent": -15.0,
        "top_category": "transport",
        "monthly_change_percent": 5.0,
        "recommendations": [
            {
                "id": "rec-1",
                "title": "Title",
                "description": "Desc",
                "category": "transport",
                "estimated_saving_kg": 20.0,
                "difficulty": "easy",
            }
        ],
        "achievements": ["first_log"],
        "generated_at": "2026-05-01T12:00:00Z",
    }

    await save_insights("user-123", insight_data)
    doc_mock.set.assert_called_once()
    called_data = doc_mock.set.call_args[0][0]
    assert called_data["userId"] == "user-123"
    assert called_data["footprintKg"] == 100.0
    assert called_data["recommendations"][0]["estimatedSavingKg"] == 20.0


@pytest.mark.asyncio
async def test_acknowledge_recommendation(mock_db) -> None:
    """acknowledge_recommendation appends recommendation_id idempotently using ArrayUnion."""
    doc_mock = MagicMock()
    doc_mock.set = AsyncMock()
    mock_db.collection.return_value.document.return_value = doc_mock
    await acknowledge_recommendation("user-123", "rec-transport-carpool")
    doc_mock.set.assert_called_once()
    called_data = doc_mock.set.call_args[0][0]
    assert "acknowledgedIds" in called_data
    # Verify ArrayUnion was called correctly
    google.cloud.firestore.ArrayUnion.assert_called_once_with(["rec-transport-carpool"])
    assert called_data["acknowledgedIds"] == google.cloud.firestore.ArrayUnion.return_value


@pytest.mark.asyncio
async def test_get_education(mock_db) -> None:
    """get_education retrieves published articles, filtering category and stripping content."""
    query_mock = MagicMock()
    query_mock.where.return_value = query_mock

    snap1 = MagicMock(id="slug-1")
    snap1.to_dict.return_value = {
        "title": "Title 1",
        "category": "transport",
        "readTime": 5,
        "updatedAt": "2026-05-01T12:00:00Z",
        "content": "Markdown content",
    }
    query_mock.stream = lambda: AsyncMockIterator([snap1])
    mock_db.collection.return_value = query_mock

    res = await get_education(category="transport")
    assert len(res) == 1
    assert res[0]["slug"] == "slug-1"
    assert "content" not in res[0]  # Stripped for summary list


@pytest.mark.asyncio
async def test_get_education_by_slug_not_found(mock_db) -> None:
    """get_education_by_slug returns None if target article is missing."""
    doc_mock = MagicMock()
    doc_mock.get = AsyncMock(return_value=MagicMock(exists=False))
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await get_education_by_slug("missing-slug") is None


@pytest.mark.asyncio
async def test_get_education_by_slug_unpublished(mock_db) -> None:
    """get_education_by_slug returns None if target article is not published."""
    doc_mock = MagicMock()
    snapshot_mock = MagicMock(exists=True)
    snapshot_mock.to_dict.return_value = {"published": False}
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    mock_db.collection.return_value.document.return_value = doc_mock

    assert await get_education_by_slug("unpublished-slug") is None


@pytest.mark.asyncio
async def test_get_education_by_slug_success(mock_db) -> None:
    """get_education_by_slug returns full article if published."""
    doc_mock = MagicMock()
    snapshot_mock = MagicMock(exists=True, id="slug-1")
    snapshot_mock.to_dict.return_value = {
        "title": "Title 1",
        "category": "transport",
        "readTime": 5,
        "updatedAt": "2026-05-01T12:00:00Z",
        "content": "Full markdown content",
        "published": True,
    }
    doc_mock.get = AsyncMock(return_value=snapshot_mock)
    mock_db.collection.return_value.document.return_value = doc_mock

    res = await get_education_by_slug("slug-1")
    assert res is not None
    assert res["slug"] == "slug-1"
    assert res["content"] == "Full markdown content"


@pytest.mark.asyncio
async def test_log_activity_malformed_last_log_date(mock_db) -> None:
    """log_activity resets streak to 1 if lastLogDate in user profile is malformed."""
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    doc_ref_mock = MagicMock(id="act-new")
    coll_activities.add = AsyncMock(return_value=(None, doc_ref_mock))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {
        "monthlyTotals": {},
        "totalCarbonKg": 0.0,
        "streak": 5,
        "lastLogDate": "not-an-iso-date",
    }
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    await log_activity(
        uid="user-123",
        category="transport",
        subcategory="car_petrol",
        amount=10.0,
        unit="km",
        carbon_kg=1.9,
        date_str="2026-05-01",
        notes=None,
    )

    # Streak should reset to 1 due to ValueError on date parsing
    streak_call = user_doc_mock.update.call_args_list[1][0][0]
    assert streak_call["streak"] == 1


@pytest.mark.asyncio
async def test_log_activity_missing_last_log_date(mock_db) -> None:
    """log_activity resets streak to 1 if lastLogDate in user profile is missing."""
    coll_activities = MagicMock()
    coll_users = MagicMock()

    def collection_mock(name):
        if name == "activities":
            return coll_activities
        if name == "users":
            return coll_users
        return MagicMock()

    mock_db.collection.side_effect = collection_mock

    doc_ref_mock = MagicMock(id="act-new")
    coll_activities.add = AsyncMock(return_value=(None, doc_ref_mock))

    user_doc_mock = MagicMock()
    user_snap_mock = MagicMock(exists=True)
    user_snap_mock.to_dict.return_value = {
        "monthlyTotals": {},
        "totalCarbonKg": 0.0,
        "streak": 5,
        "lastLogDate": None,
    }
    user_doc_mock.get = AsyncMock(return_value=user_snap_mock)
    user_doc_mock.update = AsyncMock()
    coll_users.document.return_value = user_doc_mock

    await log_activity(
        uid="user-123",
        category="transport",
        subcategory="car_petrol",
        amount=10.0,
        unit="km",
        carbon_kg=1.9,
        date_str="2026-05-01",
        notes=None,
    )

    # Streak should reset to 1 due to missing date
    streak_call = user_doc_mock.update.call_args_list[1][0][0]
    assert streak_call["streak"] == 1
