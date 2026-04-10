from __future__ import annotations
from typing import Optional, List, Dict, Any
from app.tutor.state import TutorSessionState, TutorStateMode
from app.tutor.quiz_strategy import QuizStrategy
from app.tutor.idle import IdleDetector
from app.domain.learning.services import LearningService
from app.domain.learning.models import KUStatus


class TutorEngine:
    """ Orchestrates the teaching flow and provides context for the LLM. """

    def __init__(self, state: TutorSessionState, learning_service: LearningService):
        self.state = state
        self.learning_service = learning_service

    async def get_tutor_context(self, user_input: str) -> Dict[str, Any]:
        """
        Processes user input to determine the tutor's next behavioral 'Action'
        and retrieves the necessary database content (Real Lessons).
        """
        self.state.record_interaction()
        ui = user_input.lower().strip()

        # ── 1. Learning Intent (Start Lesson Batch) ───────────────────
        if any(keyword in ui for keyword in ["learn", "học", "start"]):
            due_items = await self.learning_service.get_due_items(self.state.user_id, limit=3)
            # Fetch new lessons if queue is empty (fresh user)
            if not due_items:
                due_items = await self.learning_service.get_new_lessons(self.state.user_id, limit=3)
            
            self.state.reset_batch()
            self.state.mode = TutorStateMode.LEARNING
            for item in due_items:
                self.state.lessons_delivered += 1
                self.state.current_batch_count += 1
            
            return {
                "action": "DELIVER_BATCH",
                "items": [item.model_dump() for item in due_items],
                "note": "Acknowledge the user's return and introduce these items. Ask if they want examples or a quiz."
            }

        # ── 2. Interaction: Next / Continue ───────────────────────────
        if any(keyword in ui for keyword in ["next", "tiếp", "continue"]):
            if self.state.current_batch_count < QuizStrategy.MAX_BATCH_LESSONS:
                items = await self.learning_service.get_due_items(self.state.user_id, limit=1)
                if items:
                    self.state.lessons_delivered += 1
                    self.state.current_batch_count += 1
                    return {
                        "action": "DELIVER_SINGLE",
                        "items": [items[0].model_dump()],
                        "note": "Transition to this next item. Ask a warm personal question or context."
                    }
                else:
                    return {
                        "action": "CONVERSATION",
                        "items": [],
                        "note": "Celebrate completion of current lessons. No more due items."
                    }
            else:
                self.state.is_quiz_ready = True
                return {
                    "action": "SUGGEST_QUIZ",
                    "items": [],
                    "note": "Suggest doing a quiz now because enough lessons have been covered."
                }

        # ── 3. Interaction: More Examples ─────────────────────────────
        if any(keyword in ui for keyword in ["example", "ví dụ", "thêm"]):
            self.state.mode = TutorStateMode.INTERACTING
            # LLM will handle the content, we just mark the mode
            return {
                "action": "PROVIDE_EXAMPLES",
                "items": [],
                "note": "The user wants more examples. Provide natural Japanese examples for the last discussed item."
            }

        # ── 4. General Response / Questions ───────────────────────────
        self.state.mode = TutorStateMode.INTERACTING
        if QuizStrategy.evaluate(self.state):
            self.state.is_quiz_ready = True
            return {
                "action": "SUGGEST_QUIZ",
                "items": [],
                "note": "User seems confident. Suggest a quiz."
            }

        return {
            "action": "CONVERSATION",
            "items": [],
            "note": "Respond to the user naturally as Hanachan. Correction of errors is priority."
        }
