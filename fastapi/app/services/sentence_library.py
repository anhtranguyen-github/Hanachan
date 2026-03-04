import logging
import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field

from app.core.supabase import supabase
from app.core.llm import make_embedding_model

logger = logging.getLogger(__name__)


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
        now = datetime.now(timezone.utc).isoformat()
        
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
        sentence_data = {
            "id": sentence_id,
            "user_id": user_id,
            "japanese": data.japanese,
            "furigana": data.furigana,
            "romaji": data.romaji,
            "english": data.english,
            "source_type": data.source_type,
            "source_id": data.source_id,
            "source_timestamp": data.source_timestamp,
            "jlpt_level": data.jlpt_level,
            "difficulty_score": difficulty_score,
            "word_count": word_count,
            "tokens": tokens,
            "featured_ku_ids": featured_ku_ids,
            "featured_grammar_ids": featured_grammar_ids,
            "tags": data.tags,
            "category": data.category,
            "is_favorite": False,
            "notes": data.notes,
            "created_at": now,
            "updated_at": now
        }
        
        supabase.table("sentences").insert(sentence_data).execute()
        
        # Generate and store embedding
        self._generate_embedding(sentence_id, user_id, data.japanese)
        
        return self.get_sentence(sentence_id, user_id)
    
    def _generate_embedding(self, sentence_id: str, user_id: str, text: str) -> None:
        """Generate and store embedding for a sentence."""
        try:
            embedder = self._get_embedder()
            embedding = embedder.embed_query(text)
            
            embedding_data = {
                "sentence_id": sentence_id,
                "user_id": user_id,
                "embedding": embedding,
                "embedding_model": 'text-embedding-3-small',
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            supabase.table("sentence_embeddings").upsert(embedding_data, on_conflict="sentence_id").execute()
        except Exception as e:
            logger.error(f"Failed to generate embedding for sentence {sentence_id}: {e}")
    
    def get_sentence(self, sentence_id: str, user_id: str) -> Optional[Sentence]:
        """Get a sentence by ID with learning state."""
        # Using Supabase's join syntax
        result = supabase.table("sentences") \
            .select("*, fs:user_fsrs_states(state, next_review)") \
            .eq("id", sentence_id) \
            .eq("user_id", user_id) \
            .eq("fs.item_type", "sentence") \
            .execute()
        
        if not result.data:
            return None
        
        row = result.data[0]
        # Flatten join result
        fs_data = row.pop("fs", [])
        if fs_data and isinstance(fs_data, list):
            row["learning_state"] = fs_data[0].get("state")
            row["next_review"] = fs_data[0].get("next_review")
            
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
            next_review=datetime.fromisoformat(row["next_review"].replace("Z", "+00:00")) if row.get("next_review") else None,
            created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00"))
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
        query = supabase.table("sentences") \
            .select("*, fs:user_fsrs_states(state, next_review)", count="exact") \
            .eq("user_id", user_id) \
            .eq("fs.item_type", "sentence")
            
        if category:
            query = query.eq("category", category)
        if jlpt_level:
            query = query.eq("jlpt_level", jlpt_level)
        if is_favorite is not None:
            query = query.eq("is_favorite", is_favorite)
        if source_type:
            query = query.eq("source_type", source_type)
        if search_query:
            query = query.ilike("japanese", f"%{search_query}%")
            
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        sentences = []
        for row in result.data or []:
            fs_data = row.pop("fs", [])
            if fs_data and isinstance(fs_data, list):
                row["learning_state"] = fs_data[0].get("state")
                row["next_review"] = fs_data[0].get("next_review")
            sentences.append(self._row_to_sentence(row))
            
        return sentences, result.count or 0
    
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
            
            # Using Supabase RPC for vector search
            # Assumes 'match_sentences' RPC exists
            result = supabase.rpc("match_sentences", {
                "query_embedding": query_embedding,
                "match_threshold": min_similarity,
                "match_count": limit,
                "user_id": user_id
            }).execute()
            
            results = []
            for row in result.data or []:
                # We need to fetch the full sentence data if RPC only returns minimal info
                # or ensure the RPC returns all needed fields.
                # Assuming RPC returns full sentence fields joined with fsrs_states
                sentence = self._row_to_sentence(row)
                results.append(SentenceSearchResult(
                    sentence=sentence,
                    similarity_score=row.get("similarity", 0.0)
                ))
            
            return results
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
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
            res = supabase.table("knowledge_units").select("id, level").eq("character", surface).limit(1).execute()
            ku = res.data[0] if res.data else None
            
            if not ku and base_form != surface:
                res = supabase.table("knowledge_units").select("id, level").eq("character", base_form).limit(1).execute()
                ku = res.data[0] if res.data else None
            
            if ku:
                token_data["ku_id"] = str(ku["id"])
                token_data["jlpt_level"] = self._level_to_jlpt(ku["level"])
                featured_ku_ids.append(str(ku["id"]))
                max_jlpt = min(max_jlpt, token_data["jlpt_level"])
                vocab_breakdown.append({
                    "word": surface,
                    "reading": reading,
                    "meaning": "",  
                    "jlpt": token_data["jlpt_level"]
                })
            
            tokens.append(token_data)
            word_difficulty = len(surface) * 5
            if token_data["jlpt_level"]:
                word_difficulty += (6 - token_data["jlpt_level"]) * 10
            total_difficulty += word_difficulty
        
        difficulty_score = min(100, max(1, total_difficulty // max(1, len(tokens))))
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
        patterns = {
            "て-form": ["て", "で"],
            "た-form": ["た", "だ"],
            "ている": ["て", "いる"] or ["で", "いる"],
            "ます-form": ["ます"],
            "に/へ": ["に", "へ"],
        }
        for pattern_name, pattern_tokens in patterns.items():
            for i, token in enumerate(tokens):
                if token["surface"] in pattern_tokens:
                    grammar_points.append({
                        "pattern": pattern_name,
                        "position": i,
                        "tokens": pattern_tokens,
                        "ku_id": None
                    })
        return grammar_points
    
    def get_sentences_for_review(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[Sentence]:
        """Get sentences due for review based on FSRS schedule."""
        result = supabase.table("user_fsrs_states") \
            .select("*, sentences(*)") \
            .eq("user_id", user_id) \
            .eq("item_type", "sentence") \
            .lte("next_review", (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()) \
            .order("next_review", desc=False) \
            .limit(limit) \
            .execute()
            
        sentences = []
        for row in result.data or []:
            s_data = row.pop("sentences")
            if s_data:
                s_data["learning_state"] = row["state"]
                s_data["next_review"] = row["next_review"]
                sentences.append(self._row_to_sentence(s_data))
        return sentences
    
    def get_lesson_sentences(
        self,
        user_id: str,
        target_ku_ids: List[str],
        limit: int = 5
    ) -> List[Sentence]:
        """Get sentences that feature specific knowledge units for lessons."""
        if not target_ku_ids:
            return []
        
        # Supabase doesn't support array overlap (&&) directly in Python SDK filter methods yet,
        # but we can use 'contains' if we check for at least one.
        # Actually, rpc or direct SQL might be better if complex, but let's try 'cs' (contains).
        # We want sentences where featured_ku_ids contains ANY of the target_ku_ids.
        # This is hard with 'cs' if target_ku_ids has multiple items. 
        # For simplicity, we'll just search for sentences where featured_ku_ids contains the first one, or do multiple queries.
        
        # fallback: search for first KU
        result = supabase.table("sentences") \
            .select("*, fs:user_fsrs_states(state, next_review)") \
            .eq("user_id", user_id) \
            .contains("featured_ku_ids", target_ku_ids[:1]) \
            .execute()
            
        sentences = []
        for row in result.data or []:
            fs_data = row.pop("fs", [])
            if fs_data and isinstance(fs_data, list):
                row["learning_state"] = fs_data[0].get("state")
                row["next_review"] = fs_data[0].get("next_review")
            if not row.get("learning_state") or row["learning_state"] in ['new', 'learning']:
                sentences.append(self._row_to_sentence(row))
                
        return sentences[:limit]
    
    def update_sentence(
        self,
        sentence_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Sentence]:
        """Update a sentence's properties."""
        allowed_fields = ["japanese", "furigana", "romaji", "english", 
                         "tags", "category", "is_favorite", "notes", "jlpt_level"]
        
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        if not filtered_updates:
            return self.get_sentence(sentence_id, user_id)
            
        filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        supabase.table("sentences").update(filtered_updates).eq("id", sentence_id).eq("user_id", user_id).execute()
        
        return self.get_sentence(sentence_id, user_id)
    
    def delete_sentence(self, sentence_id: str, user_id: str) -> bool:
        """Delete a sentence from the library."""
        result = supabase.table("sentences").delete().eq("id", sentence_id).eq("user_id", user_id).execute()
        return len(result.data or []) > 0


# Singleton instance
_sentence_library_service: Optional[SentenceLibraryService] = None


def get_sentence_library_service() -> SentenceLibraryService:
    """Get the singleton sentence library service instance."""
    global _sentence_library_service
    if _sentence_library_service is None:
        _sentence_library_service = SentenceLibraryService()
    return _sentence_library_service
