"""
Schemas for Video Dictation API
"""

from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class VideoDictationSettings(BaseModel):
    """Settings for a dictation session."""

    included_jlpt_levels: List[int] = Field(
        default_factory=lambda: [5, 4, 3, 2, 1],
        description="Which JLPT levels to include in dictation",
    )
    min_subtitle_length: int = Field(1, description="Minimum subtitle length in characters")
    max_subtitle_length: int = Field(100, description="Maximum subtitle length in characters")
    enable_reading_hint: bool = Field(False, description="Show hiragana reading hint")
    playback_speed: float = Field(1.0, description="Audio playback speed")
    auto_advance: bool = Field(True, description="Auto advance to next after correct")


class DictationSubtitleItem(BaseModel):
    """A single subtitle for dictation practice."""

    id: str = Field(..., description="Subtitle ID")
    text: str = Field(..., description="Japanese text to type")
    reading: Optional[str] = Field(None, description="Hiragana reading (optional)")
    start_time_ms: int = Field(..., description="Start time in milliseconds")
    end_time_ms: int = Field(..., description="End time in milliseconds")


class CreateDictationSessionRequest(BaseModel):
    """Request to create a new dictation session."""

    video_id: str = Field(..., description="Video ID to practice dictation with")
    settings: Optional[VideoDictationSettings] = Field(
        None, description="Session settings"
    )


class DictationSessionResponse(BaseModel):
    """Response for a dictation session."""

    success: bool = Field(..., description="Whether the session was created")
    session_id: Optional[str] = Field(None, description="Session identifier")
    video_id: str = Field(..., description="Video ID")
    subtitles: List[DictationSubtitleItem] = Field(
        default_factory=list, description="Subtitles for dictation"
    )
    total_subtitles: int = Field(0, description="Total number of subtitles")
    error: Optional[str] = Field(None, description="Error message if failed")


class SubmitDictationAttemptRequest(BaseModel):
    """Request to submit a dictation attempt."""

    session_id: str = Field(..., description="Session ID")
    subtitle_id: str = Field(..., description="Subtitle ID being attempted")
    user_input: str = Field(..., description="What the user typed")
    time_taken_ms: int = Field(0, description="Time taken to type")


class DictationAttemptResult(BaseModel):
    """Result of a dictation attempt."""

    subtitle_id: str = Field(..., description="Subtitle ID")
    target_text: str = Field(..., description="Original text")
    user_input: str = Field(..., description="What user typed")
    is_correct: bool = Field(..., description="Whether it matched exactly")
    accuracy_score: int = Field(..., description="Similarity score 0-100")
    correct_chars: int = Field(..., description="Number of correct characters")
    total_chars: int = Field(..., description="Total characters in target")


class SubmitDictationAttemptResponse(BaseModel):
    """Response for submitting a dictation attempt."""

    success: bool = Field(..., description="Whether submission was successful")
    result: Optional[DictationAttemptResult] = Field(None, description="Attempt result")
    is_complete: bool = Field(False, description="Whether session is complete")
    remaining: int = Field(0, description="Number of subtitles remaining")


class DictationSessionStatusResponse(BaseModel):
    """Response for getting session status."""

    session_id: str = Field(..., description="Session ID")
    video_id: str = Field(..., description="Video ID")
    total_subtitles: int = Field(..., description="Total subtitles in session")
    completed_count: int = Field(..., description="Number completed")
    correct_count: int = Field(..., description="Number correct")
    accuracy_percent: int = Field(..., description="Current accuracy")
    status: str = Field(..., description="Session status")


class DictationStatsResponse(BaseModel):
    """Response for dictation statistics."""

    total_sessions: int = Field(0, description="Total dictation sessions")
    total_attempts: int = Field(0, description="Total dictation attempts")
    average_accuracy: float = Field(0.0, description="Average accuracy score")
    videos_practiced: int = Field(0, description="Unique videos practiced")
    current_streak: int = Field(0, description="Current practice streak")
    best_accuracy: int = Field(0, description="Best accuracy achieved")
