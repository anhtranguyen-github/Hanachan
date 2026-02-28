"""
Schemas for Speaking Practice API
"""

from __future__ import annotations

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PracticeSentenceSchema(BaseModel):
    """Schema for a single practice sentence."""
    japanese: str = Field(..., description="Japanese sentence")
    reading: str = Field(..., description="Reading/romaji")
    english: str = Field(..., description="English translation")
    source_word: str = Field(..., description="The word this sentence is based on")
    difficulty: str = Field(..., description="Difficulty level: beginner, intermediate, advanced")
    learned_words_count: int = Field(..., description="Number of learned words in sentence")
    audio_url: Optional[str] = Field(None, description="Audio URL for native pronunciation")


class CreatePracticeSessionRequest(BaseModel):
    """Request to create a new speaking practice session."""
    target_difficulty: Optional[str] = Field(
        None, 
        description="Target difficulty: beginner, intermediate, advanced (auto-detected if not provided)"
    )


class AdaptiveFeedback(BaseModel):
    """Adaptive feedback after a pronunciation attempt."""
    next_action: str = Field(..., description="What to do next: repeat, simpler, next, advance, mastered")
    next_difficulty: str = Field(..., description="Recommended difficulty for next sentence")
    reason: str = Field(..., description="Human-readable reason for the recommendation")
    should_repeat: bool = Field(..., description="Whether to repeat the current sentence")


class PracticeSessionResponse(BaseModel):
    """Response for a speaking practice session."""
    success: bool = Field(..., description="Whether the session was created successfully")
    session_id: Optional[str] = Field(None, description="Unique session identifier")
    sentences: List[PracticeSentenceSchema] = Field(default_factory=list, description="Selected sentences for practice")
    difficulty: str = Field(..., description="Current difficulty level")
    user_level: int = Field(..., description="User's curriculum level")
    total_sentences: int = Field(..., description="Total number of sentences in session")
    error: Optional[str] = Field(None, description="Error message if success is false")


class NextPracticeItemResponse(BaseModel):
    """Response for getting the next practice item."""
    success: bool = Field(..., description="Whether the request was successful")
    sentence: Optional[PracticeSentenceSchema] = Field(None, description="Next sentence to practice")
    index: int = Field(..., description="Current index in the session")
    is_complete: bool = Field(..., description="Whether the session is complete")
    feedback: Optional[AdaptiveFeedback] = Field(None, description="Adaptive feedback based on last attempt")


class RecordAttemptRequest(BaseModel):
    """Request to record a pronunciation attempt."""
    session_id: str = Field(..., description="Session identifier")
    sentence: str = Field(..., description="The sentence that was practiced")
    score: int = Field(..., description="Pronunciation score (0-100)")
    word: str = Field(..., description="The word being practiced")


class RecordAttemptResponse(BaseModel):
    """Response for recording an attempt."""
    success: bool = Field(..., description="Whether the attempt was recorded")
    recorded: bool = Field(..., description="Whether data was persisted")


class PracticeStatsResponse(BaseModel):
    """Response for practice statistics."""
    total_sessions: int = Field(0, description="Total practice sessions")
    total_attempts: int = Field(0, description="Total practice attempts")
    average_score: float = Field(0.0, description="Average pronunciation score")
    words_practiced: int = Field(0, description="Unique words practiced")
    current_streak: int = Field(0, description="Current practice streak in days")
