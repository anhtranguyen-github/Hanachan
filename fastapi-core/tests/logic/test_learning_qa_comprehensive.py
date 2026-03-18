import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
from app.services.learning import LearningService
from app.models.learning import KUStatus, SRSStage, Rating, DashboardStats

@pytest.fixture
def mock_repo():
    return MagicMock()

@pytest.fixture
def service(mock_repo):
    return LearningService(mock_repo)

@pytest.mark.asyncio
async def test_qa_deck_filtering_due_items(service, mock_repo):
    """
    QA: Learn via different decks / Learn on a single deck
    Verifies that the review queue is correctly filtered by enabled decks.
    """
    user_id = "user_qa"
    enabled_decks = ["deck_n5", "deck_custom"]
    
    # Mock enabled decks
    mock_repo.get_enabled_deck_ids = AsyncMock(return_value=enabled_decks)
    
    # Mock filtered due items
    mock_repo.get_due_items_filtered = AsyncMock(return_value=[
        KUStatus(user_id=user_id, item_id="n5_ku1", facet="meaning", state=SRSStage.NEW, stability=0.1, difficulty=3.0, reps=0, lapses=0),
        KUStatus(user_id=user_id, item_id="custom_ku1", facet="meaning", state=SRSStage.LEARNING, stability=1.0, difficulty=3.0, reps=1, lapses=0)
    ])
    
    due_items = await service.get_due_items(user_id)
    
    assert len(due_items) == 2
    mock_repo.get_due_items_filtered.assert_called_once_with(user_id, enabled_decks, 20)

@pytest.mark.asyncio
async def test_qa_deck_dashboard_progress(service, mock_repo):
    """
    QA: Check progress of each deck
    Verifies that dashboard stats are correctly filtered when a deck_id is provided.
    """
    user_id = "user_qa"
    deck_id = "deck_n5"
    
    # KU 'A' is in the deck, KU 'B' is NOT.
    deck_item_ids = ["kuA"]
    mock_repo.get_deck_items = AsyncMock(return_value=deck_item_ids)
    
    # All states for the user
    mock_repo.get_all_user_states = AsyncMock(return_value=[
        {"item_id": "kuA", "state": "review", "stability": 15.0, "knowledge_units": {"type": "kanji", "level": 1}, "next_review": "2026-01-01T00:00:00Z"},
        {"item_id": "kuB", "state": "learning", "stability": 1.0, "knowledge_units": {"type": "vocab", "level": 1}, "next_review": "2026-01-01T00:00:00Z"}
    ])
    
    mock_repo.get_review_logs = AsyncMock(return_value=[])
    mock_repo.get_review_forecast = AsyncMock(return_value=[])
    mock_repo.get_total_ku_count = AsyncMock(return_value=100)
    
    stats = await service.get_dashboard_stats(user_id, deck_id=deck_id)
    
    # Should only see stats for kuA
    assert stats.totalLearned == 1
    assert stats.totalMastered == 1
    assert stats.deckId == deck_id
    mock_repo.get_deck_items.assert_called_once_with(deck_id)

@pytest.mark.asyncio
async def test_qa_cross_status_sharing(service, mock_repo):
    """
    QA: Check cross status
    Verifies that a review updates the global FSRS state, which affects all decks.
    """
    user_id = "user_qa"
    ku_id = "ku_shared"
    
    # Mock repository behavior
    mock_repo.get_ku_status = AsyncMock(return_value=None) # Start as new
    mock_repo.get_user_fsrs_settings = AsyncMock(return_value={})
    mock_repo.upsert_ku_status = AsyncMock()
    mock_repo.log_review = AsyncMock()
    
    # User reviews the item (implicit context)
    await service.submit_review(user_id, ku_id, "meaning", Rating.GOOD)
    
    # Verify the state is updated in the central table 'user_fsrs_states'
    assert mock_repo.upsert_ku_status.called
    updated_status = mock_repo.upsert_ku_status.call_args[0][0]
    assert updated_status.item_id == ku_id
    assert updated_status.state == SRSStage.LEARNING
    
    # Now simulate a dashboard view for a deck containing this item
    mock_repo.get_all_user_states = AsyncMock(return_value=[
        {"item_id": ku_id, "state": "learning", "stability": 1.0, "knowledge_units": {"type": "kanji", "level": 1}, "next_review": "2026-01-01T00:00:00Z"}
    ])
    mock_repo.get_deck_items = AsyncMock(return_value=[ku_id])
    mock_repo.get_review_logs = AsyncMock(return_value=[])
    mock_repo.get_review_forecast = AsyncMock(return_value=[])
    mock_repo.get_total_ku_count = AsyncMock(return_value=100)
    
    stats = await service.get_dashboard_stats(user_id, deck_id="some_deck")
    assert stats.totalLearned == 1 # Item is now picked up as learned in THIS deck too

@pytest.mark.asyncio
async def test_qa_deck_crud_toggle(service, mock_repo):
    """
    QA: CRUD decks (Toggle/Workspace management)
    """
    user_id = "user_qa"
    deck_id = "deck_123"
    
    mock_repo.upsert_user_deck_settings = AsyncMock()
    
    result = await service.toggle_deck(user_id, deck_id, True)
    
    assert result["is_enabled"] is True
    mock_repo.upsert_user_deck_settings.assert_called_once_with(user_id, deck_id, True)
