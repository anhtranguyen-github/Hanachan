from datetime import datetime

from app.domain.learning.models import Rating, SRSStage, SRSState
from app.domain.learning.services import FSRSEngine


def test_fsrs_engine_next_review_calculation():
    """QA-FSRS-01: Next Review Calculation for a new item"""
    initial_state = SRSState()
    # Sending Pass rating for a new item
    # wrong_count = 0 means pure success
    next_review, next_state = FSRSEngine.calculate_next_review(
        initial_state, Rating.PASS, wrong_count=0
    )

    assert next_state.reps == 1
    # Stability should step up to initial threshold (0.166 or similar)
    assert next_state.stability >= 0.166
    assert next_state.stage == SRSStage.LEARNING
    # Review time should be in the future
    assert next_review > datetime.utcnow()


def test_fsrs_engine_fif_punishment():
    """QA-FSRS-02: FIF Punishment for struggling item"""
    # Item that is currently in REVIEW
    struggling_state = SRSState(
        stage=SRSStage.REVIEW, stability=1.0, difficulty=3.0, reps=3, lapses=0
    )

    # User gets it entirely wrong repeatedly (wrong_count=5) but eventually passes
    next_review, next_state = FSRSEngine.calculate_next_review(
        struggling_state, Rating.PASS, wrong_count=5
    )

    # Difficulty should increase
    assert next_state.difficulty > 3.0
    # Stability should degrade
    assert next_state.stability < 1.0
    # Reps should be halved and fall back to LEARNING because failure intensity > 0.8
    assert next_state.stage == SRSStage.LEARNING
    assert next_state.lapses == 1
    assert next_state.reps == 2  # Math.floor((3+1) * 0.5) => 2


def test_fsrs_engine_hard_reset():
    """QA-FSRS: Hard reset testing"""
    state_to_reset = SRSState(
        stage=SRSStage.REVIEW, stability=10.0, difficulty=2.0, reps=10, lapses=0
    )

    # Rating.AGAIN hard reset
    next_review, next_state = FSRSEngine.calculate_next_review(
        state_to_reset, Rating.AGAIN, wrong_count=0
    )
    assert next_state.reps == 0
    assert next_state.lapses == 1
    assert next_state.stage == SRSStage.LEARNING
    assert next_state.stability == 5.0  # Max(0.1, 10.0 * 0.5)
