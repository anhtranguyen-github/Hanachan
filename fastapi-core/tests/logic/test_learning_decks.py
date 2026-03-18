import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
from app.services.learning import LearningService
from app.models.learning import KUStatus, SRSStage, Rating

@pytest.mark.asyncio
async def test_review_queue_deduplication():
    # Setup: KU 'A' is in Deck 1 and Deck 2. Both enabled.
    repo = MagicMock()
    service = LearningService(repo)
    
    user_id = "user123"
    deck_ids = ["deck1", "deck2"]
    
    repo.get_enabled_deck_ids = AsyncMock(return_value=deck_ids)
    
    # Mock filtered due items: Repo handles deduplication in SQL as per implementation
    repo.get_due_items_filtered = AsyncMock(return_value=[
        KUStatus(user_id=user_id, item_id="kuA", facet="meaning", state=SRSStage.NEW, stability=0.1, difficulty=3.0, reps=0, lapses=0)
    ])
    
    due_items = await service.get_due_items(user_id)
    
    assert len(due_items) == 1
    assert due_items[0].item_id == "kuA"
    repo.get_due_items_filtered.assert_called_once_with(user_id, deck_ids, 20)

@pytest.mark.asyncio
async def test_fsrs_state_sharing():
    # Setup: Reviewing 'kuA' updates the global state
    repo = MagicMock()
    service = LearningService(repo)
    
    user_id = "user123"
    ku_id = "kuA"
    
    repo.get_ku_status = AsyncMock(return_value=None) # New item
    repo.get_user_fsrs_settings = AsyncMock(return_value={})
    repo.upsert_ku_status = AsyncMock()
    repo.log_review = AsyncMock()
    
    await service.submit_review(user_id, ku_id, "meaning", Rating.GOOD)
    
    # Verify that the update went to the global user_fsrs_states
    repo.upsert_ku_status.assert_called_once()
    called_status = repo.upsert_ku_status.call_args[0][0]
    assert called_status.item_id == ku_id
    assert called_status.state == SRSStage.LEARNING # New + GOOD = LEARNING
