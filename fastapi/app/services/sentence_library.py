# ruff: noqa: S608
"""
Sentence Library Service
Manages user's personal sentence collection with semantic search capabilities.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field

from ..core.database import execute_query, execute_single
from ..core.llm import make_embedding_model


class SentenceCreate(BaseModel):
    """Data for creating a new sentence."""
    japanese: str
    english: str
    furigana: Optional[str] = None
    romaji: Optional[str] = None
    source_type: str = "manual"  # manual, video, reading, chat, import
    source_id: Optional[str] = None
    source_timestamp: Optional[int] = None
    jlpt_level: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    category: str = "general"
    notes: Optional[str] = None


class Sentence(BaseModel):
    """A sentence in the user's library."""
    id: str
    user_id: str
    japanese: str
    furigana: Optional[str]
    romaji: Optional[str]
    english: str
    source_type: str
    source_id: Optional[str]
    source_timestamp: Optional[int]
    jlpt_level: Optional[int]
    difficulty_score: int
    word_count: int
    tokens: List[Dict[str, Any]]
    featured_ku_ids: List[str]
    featured_grammar_ids: List[str]
    tags: List[str]
    category: str
    is_favorite: bool
    notes: Optional[str]
    learning_state: Optional[str] = None
    next_review: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class SentenceAnalysis(BaseModel):
    """Analysis result for a sentence."""
    japanese: str
    tokens: List[Dict[str, Any]]
    grammar_points: List[Dict[str, Any]]
    jlpt_level: int
    difficulty_score: int
    featured_ku_ids: List[str]
    featured_grammar_ids: List[str]
    vocabulary_breakdown: List[Dict[str, Any]]


class SentenceSearchResult(BaseModel):
    """Search result with similarity score."""
    sentence: Sentence
    similarity_score: float


class SentenceLibraryService:
    """Service for managing the sentence library."""
    
    def __init__(self):
        self._embedder = None
    
    def _get_embedder(self):
        """Lazy initialization of embedding model."""
        if self._embedder is None:
            self._embedder = make_embedding_model()
        return self._embedder
    
    def create_sentence(
        self, 
        user_id: str, 
        data: SentenceCreate,
        auto_analyze: bool = True
    ) -> Sentence:
        """Create a new sentence in the library."""
        sentence_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        # Analyze if requested
        tokens = []
        featured_ku_ids = []
        featured_grammar_ids = []
        difficulty_score = 50
        word_count = len(data.japanese.split())
        
        if auto_analyze:
            analysis = self.analyze_sentence(data.japanese, user_id)
            tokens = analysis.tokens
            featured_ku_ids = analysis.featured_ku_ids
            featured_grammar_ids = analysis.featured_grammar_ids
            difficulty_score = analysis.difficulty_score
            word_count = len(tokens)
        
        # Insert sentence
        execute_query(
            """
            INSERT INTO public.sentences 
                (id, user_id, japanese, furigana, romaji, english, source_type, 
                 source_id, source_timestamp, jlpt_level, difficulty_score, word_count,
                 tokens, featured_ku_ids, featured_grammar_ids, tags, category, 
                 is_favorite, notes, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (sentence_id, user_id, data.japanese, data.furigana, data.romaji,
             data.english, data.source_type, data.source_id, data.source_timestamp,
             data.jlpt_level, difficulty_score, word_count,
             json.dumps(tokens), featured_ku_ids, featured_grammar_ids,
             data.tags, data.category, False, data.notes, now, now),
            fetch=False
        )
        
        # Generate and store embedding
        self._generate_embedding(sentence_id, user_id, data.japanese)
        
        return self.get_sentence(sentence_id, user_id)
    
    def _generate_embedding(self, sentence_id: str, user_id: str, text: str) -> None:
        """Generate and store embedding for a sentence."""
        try:
            embedder = self._get_embedder()
            embedding = embedder.embed_query(text)
            
            # Convert to PostgreSQL vector format
            embedding_str = '[' + ','.join(str(x) for x in embedding) + ']'
            
            execute_query(
                """
                INSERT INTO public.sentence_embeddings 
                    (sentence_id, user_id, embedding, embedding_model, created_at)
                VALUES (%s, %s, %s::vector, %s, %s)
                ON CONFLICT (sentence_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    embedding_model = EXCLUDED.embedding_model,
                    created_at = EXCLUDED.created_at
                """,
                (sentence_id, user_id, embedding_str, 'text-embedding-3-small', 
                 datetime.now(timezone.utc)),
                fetch=False
            )
        except Exception as e:
            # Log but don't fail sentence creation
            print(f"Failed to generate embedding for sentence {sentence_id}: {e}")
    
    def get_sentence(self, sentence_id: str, user_id: str) -> Optional[Sentence]:
        """Get a sentence by ID with learning state."""
        row = execute_single(
            """
            SELECT s.*, fs.state as learning_state, fs.next_review
            FROM public.sentences s
            LEFT JOIN public.user_fsrs_states fs 
                ON fs.item_id = s.id::text AND fs.item_type = 'sentence'
                AND fs.user_id = s.user_id
            WHERE s.id = %s AND s.user_id = %s
            """,
            (sentence_id, user_id)
        )
        
        if not row:
            return None
        
        return self._row_to_sentence(row)
    
    def _row_to_sentence(self, row: Dict[str, Any]) -> Sentence:
        """Convert database row to Sentence model."""
        return Sentence(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            japanese=row["japanese"],
            furigana=row.get("furigana"),
            romaji=row.get("romaji"),
            english=row["english"],
            source_type=row["source_type"],
            source_id=str(row["source_id"]) if row.get("source_id") else None,
            source_timestamp=row.get("source_timestamp"),
            jlpt_level=row.get("jlpt_level"),
            difficulty_score=row["difficulty_score"],
            word_count=row["word_count"],
            tokens=row["tokens"] if isinstance(row["tokens"], list) else json.loads(row["tokens"] or "[]"),
            featured_ku_ids=[str(x) for x in row.get("featured_ku_ids", [])],
            featured_grammar_ids=[str(x) for x in row.get("featured_grammar_ids", [])],
            tags=row.get("tags", []),
            category=row["category"],
            is_favorite=row["is_favorite"],
            notes=row.get("notes"),
            learning_state=row.get("learning_state"),
            next_review=row.get("next_review"),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    
    def list_sentences(
        self,
        user_id: str,
        category: Optional[str] = None,
        jlpt_level: Optional[int] = None,
        is_favorite: Optional[bool] = None,
        source_type: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Sentence], int]:
        """List sentences with filters."""
        conditions = ["s.user_id = %s"]
        params: List[Any] = [user_id]
        
        if category:
            conditions.append("s.category = %s")
            params.append(category)
        
        if jlpt_level:
            conditions.append("s.jlpt_level = %s")
            params.append(jlpt_level)
        
        if is_favorite is not None:
            conditions.append("s.is_favorite = %s")
            params.append(is_favorite)
        
        if source_type:
            conditions.append("s.source_type = %s")
            params.append(source_type)
        
        where_clause = " AND ".join(conditions)
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM public.sentences s WHERE {}".format(where_clause)
        count_result = execute_single(count_query, tuple(params))
        total = count_result["total"] if count_result else 0
        
        # Get paginated results
        params.extend([limit, offset])
        query = """
            SELECT s.*, fs.state as learning_state, fs.next_review
            FROM public.sentences s
            LEFT JOIN public.user_fsrs_states fs
                ON fs.item_id = s.id::text AND fs.item_type = 'sentence'
                AND fs.user_id = s.user_id
            WHERE {}
            ORDER BY s.created_at DESC
            LIMIT %s OFFSET %s
        """.format(where_clause)
        rows = execute_query(query, tuple(params))
        
        sentences = [self._row_to_sentence(row) for row in rows]
        return sentences, total
    
    def semantic_search(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
        min_similarity: float = 0.7
    ) -> List[SentenceSearchResult]:
        """Search sentences by semantic similarity."""
        try:
            embedder = self._get_embedder()
            query_embedding = embedder.embed_query(query)
            embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'
            
            rows = execute_query(
                """
                SELECT s.*, fs.state as learning_state, fs.next_review,
                       1 - (se.embedding <=> %s::vector) as similarity
                FROM public.sentence_embeddings se
                JOIN public.sentences s ON s.id = se.sentence_id
                LEFT JOIN public.user_fsrs_states fs 
                    ON fs.item_id = s.id::text AND fs.item_type = 'sentence'
                    AND fs.user_id = s.user_id
                WHERE se.user_id = %s
                AND 1 - (se.embedding <=> %s::vector) > %s
                ORDER BY se.embedding <=> %s::vector
                LIMIT %s
                """,
                (embedding_str, user_id, embedding_str, min_similarity, embedding_str, limit)
            )
            
            results = []
            for row in rows:
                sentence = self._row_to_sentence(row)
                results.append(SentenceSearchResult(
                    sentence=sentence,
                    similarity_score=row["similarity"]
                ))
            
            return results
        except Exception as e:
            print(f"Semantic search failed: {e}")
            return []
    
    def analyze_sentence(self, japanese: str, user_id: Optional[str] = None) -> SentenceAnalysis:
        """Analyze a Japanese sentence for tokens, grammar, and difficulty."""
        from janome.tokenizer import Tokenizer
        
        t = Tokenizer()
        tokens = []
        featured_ku_ids = []
        featured_grammar_ids = []
        vocab_breakdown = []
        
        max_jlpt = 5
        total_difficulty = 0
        
        for token in t.tokenize(japanese):
            surface = token.surface
            reading = token.reading if token.reading != '*' else surface
            base_form = token.base_form if token.base_form != '*' else surface
            pos = token.part_of_speech.split(',')[0]
            
            token_data = {
                "surface": surface,
                "reading": reading,
                "base_form": base_form,
                "pos": pos,
                "jlpt_level": None,
                "ku_id": None
            }
            
            # Try to find matching knowledge unit
            ku = execute_single(
                "SELECT id, level FROM public.knowledge_units WHERE character = %s LIMIT 1",
                (surface,)
            )
            if not ku and base_form != surface:
                ku = execute_single(
                    "SELECT id, level FROM public.knowledge_units WHERE character = %s LIMIT 1",
                    (base_form,)
                )
            
            if ku:
                token_data["ku_id"] = str(ku["id"])
                token_data["jlpt_level"] = self._level_to_jlpt(ku["level"])
                featured_ku_ids.append(str(ku["id"]))
                max_jlpt = min(max_jlpt, token_data["jlpt_level"])
                vocab_breakdown.append({
                    "word": surface,
                    "reading": reading,
                    "meaning": "",  # Would need lookup
                    "jlpt": token_data["jlpt_level"]
                })
            
            tokens.append(token_data)
            # Simple difficulty calculation based on word length and JLPT
            word_difficulty = len(surface) * 5
            if token_data["jlpt_level"]:
                word_difficulty += (6 - token_data["jlpt_level"]) * 10
            total_difficulty += word_difficulty
        
        # Calculate overall difficulty score (1-100)
        difficulty_score = min(100, max(1, total_difficulty // max(1, len(tokens))))
        
        # Detect grammar points (simplified)
        grammar_points = self._detect_grammar_points(tokens)
        featured_grammar_ids = [g["ku_id"] for g in grammar_points if g.get("ku_id")]
        
        return SentenceAnalysis(
            japanese=japanese,
            tokens=tokens,
            grammar_points=grammar_points,
            jlpt_level=max_jlpt,
            difficulty_score=difficulty_score,
            featured_ku_ids=list(set(featured_ku_ids)),
            featured_grammar_ids=list(set(featured_grammar_ids)),
            vocabulary_breakdown=vocab_breakdown
        )
    
    def _level_to_jlpt(self, level: int) -> int:
        """Convert curriculum level (1-60) to JLPT level (1-5)."""
        if level <= 10:
            return 5
        elif level <= 20:
            return 4
        elif level <= 35:
            return 3
        elif level <= 50:
            return 2
        else:
            return 1
    
    def _detect_grammar_points(self, tokens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect grammar patterns in tokens."""
        grammar_points = []
        
        # Check for common patterns
        patterns = {
            "て-form": ["て", "で"],
            "た-form": ["た", "だ"],
            "ている": ["て", "いる"] or ["で", "いる"],
            "ます-form": ["ます"],
            "に/へ": ["に", "へ"],
        }
        
        for pattern_name, pattern_tokens in patterns.items():
            # Simplified matching
            for i, token in enumerate(tokens):
                if token["surface"] in pattern_tokens:
                    grammar_points.append({
                        "pattern": pattern_name,
                        "position": i,
                        "tokens": pattern_tokens,
                        "ku_id": None  # Would need lookup
                    })
        
        return grammar_points
    
    def get_sentences_for_review(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[Sentence]:
        """Get sentences due for review based on FSRS schedule."""
        rows = execute_query(
            """
            SELECT s.*, fs.state as learning_state, fs.next_review
            FROM public.sentences s
            JOIN public.user_fsrs_states fs 
                ON fs.item_id = s.id::text AND fs.item_type = 'sentence'
                AND fs.user_id = s.user_id
            WHERE s.user_id = %s
            AND fs.next_review <= NOW() + INTERVAL '1 day'
            ORDER BY fs.next_review ASC
            LIMIT %s
            """,
            (user_id, limit)
        )
        
        return [self._row_to_sentence(row) for row in rows]
    
    def get_lesson_sentences(
        self,
        user_id: str,
        target_ku_ids: List[str],
        limit: int = 5
    ) -> List[Sentence]:
        """Get sentences that feature specific knowledge units for lessons."""
        if not target_ku_ids:
            return []
        
        # Build query to find sentences containing any of the target KUs
        ku_array = '{' + ','.join(target_ku_ids) + '}'
        
        rows = execute_query(
            """
            SELECT s.*, fs.state as learning_state, fs.next_review
            FROM public.sentences s
            LEFT JOIN public.user_fsrs_states fs 
                ON fs.item_id = s.id::text AND fs.item_type = 'sentence'
                AND fs.user_id = s.user_id
            WHERE s.user_id = %s
            AND s.featured_ku_ids && %s::uuid[]
            AND (fs.state IS NULL OR fs.state IN ('new', 'learning'))
            ORDER BY s.difficulty_score ASC
            LIMIT %s
            """,
            (user_id, ku_array, limit)
        )
        
        return [self._row_to_sentence(row) for row in rows]
    
    def update_sentence(
        self,
        sentence_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Sentence]:
        """Update a sentence's properties."""
        allowed_fields = ["japanese", "furigana", "romaji", "english", 
                         "tags", "category", "is_favorite", "notes", "jlpt_level"]
        
        set_clauses = []
        params = []
        
        for field, value in updates.items():
            if field in allowed_fields:
                set_clauses.append(f"{field} = %s")
                params.append(value)
        
        if not set_clauses:
            return self.get_sentence(sentence_id, user_id)
        
        set_clauses.append("updated_at = %s")
        params.extend([datetime.now(timezone.utc), sentence_id, user_id])
        
        query = """
            UPDATE public.sentences
            SET {}
            WHERE id = %s AND user_id = %s
        """.format(', '.join(set_clauses))
        execute_query(query, tuple(params), fetch=False)
        
        return self.get_sentence(sentence_id, user_id)
    
    def delete_sentence(self, sentence_id: str, user_id: str) -> bool:
        """Delete a sentence from the library."""
        result = execute_query(
            "DELETE FROM public.sentences WHERE id = %s AND user_id = %s RETURNING id",
            (sentence_id, user_id)
        )
        return len(result) > 0


# Singleton instance
_sentence_library_service: Optional[SentenceLibraryService] = None


def get_sentence_library_service() -> SentenceLibraryService:
    """Get the singleton sentence library service instance."""
    global _sentence_library_service
    if _sentence_library_service is None:
        _sentence_library_service = SentenceLibraryService()
    return _sentence_library_service
