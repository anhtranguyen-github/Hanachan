# ruff: noqa: S608
"""
Video Embeddings Service
Manages semantic embeddings for video content enabling similarity search.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from ..core.database import execute_query, execute_single
from ..core.llm import make_embedding_model, make_llm


class VideoEmbedding(BaseModel):
    """Embedding data for a video."""
    video_id: str
    embedding_type: str  # title, description, transcript_summary
    embedding_model: str
    content_summary: Optional[str]
    created_at: datetime
    updated_at: datetime


class VideoSearchResult(BaseModel):
    """Video search result with similarity score."""
    video_id: str
    youtube_id: Optional[str]
    title: str
    description: Optional[str]
    channel_name: Optional[str]
    thumbnail_url: Optional[str]
    jlpt_level: Optional[int]
    similarity_score: float
    match_type: str  # Which embedding type matched


class TranscriptSegment(BaseModel):
    """A segment of video transcript with embedding."""
    start_time_ms: int
    end_time_ms: int
    text: str
    tokens: List[Dict[str, Any]]
    grammar_points: List[Dict[str, Any]]


class VideoEmbeddingsService:
    """Service for managing video embeddings and semantic search."""
    
    def __init__(self):
        self._embedder = None
        self._llm = None
    
    def _get_embedder(self):
        """Lazy initialization of embedding model."""
        if self._embedder is None:
            self._embedder = make_embedding_model()
        return self._embedder
    
    def _get_llm(self):
        """Lazy initialization of LLM for summarization."""
        if self._llm is None:
            self._llm = make_llm(temperature=0.3)
        return self._llm
    
    def generate_video_embeddings(self, video_id: str) -> Dict[str, Any]:
        """
        Generate embeddings for a video's title, description, and transcript.
        
        Returns:
            Dict with embedding generation results
        """
        # Get video data
        video = execute_single(
            "SELECT * FROM public.videos WHERE id = %s",
            (video_id,)
        )
        
        if not video:
            return {"success": False, "error": "Video not found"}
        
        results = {"success": True, "embeddings_created": []}
        
        # Generate title embedding
        if video.get("title"):
            self._store_embedding(
                video_id=video_id,
                embedding_type="title",
                content=video["title"],
                content_summary=video["title"][:200]
            )
            results["embeddings_created"].append("title")
        
        # Generate description embedding
        if video.get("description"):
            desc_summary = self._summarize_text(video["description"], max_chars=500)
            self._store_embedding(
                video_id=video_id,
                embedding_type="description",
                content=video["description"],
                content_summary=desc_summary
            )
            results["embeddings_created"].append("description")
        
        # Generate transcript summary embedding
        transcript_result = self._generate_transcript_embedding(video_id)
        if transcript_result["success"]:
            results["embeddings_created"].append("transcript_summary")
            results["transcript_stats"] = transcript_result.get("stats", {})
        
        return results
    
    def _store_embedding(
        self,
        video_id: str,
        embedding_type: str,
        content: str,
        content_summary: Optional[str] = None
    ) -> None:
        """Generate and store embedding for video content."""
        try:
            embedder = self._get_embedder()
            embedding = embedder.embed_query(content[:8000])  # Limit content length
            embedding_str = '[' + ','.join(str(x) for x in embedding) + ']'
            
            now = datetime.now(timezone.utc)
            
            execute_query(
                """
                INSERT INTO public.video_embeddings 
                    (video_id, embedding_type, embedding, embedding_model, 
                     content_summary, created_at, updated_at)
                VALUES (%s, %s, %s::vector, %s, %s, %s, %s)
                ON CONFLICT (video_id, embedding_type) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    embedding_model = EXCLUDED.embedding_model,
                    content_summary = EXCLUDED.content_summary,
                    updated_at = EXCLUDED.updated_at
                """,
                (video_id, embedding_type, embedding_str, 'text-embedding-3-small',
                 content_summary, now, now),
                fetch=False
            )
        except Exception as e:
            print(f"Failed to store embedding for video {video_id}: {e}")
            raise
    
    def _summarize_text(self, text: str, max_chars: int = 500) -> str:
        """Summarize text using LLM."""
        try:
            llm = self._get_llm()
            prompt = f"""Summarize the following text concisely in English, keeping the key points:

Text: {text[:3000]}

Summary (max 3 sentences):"""
            
            response = llm.invoke(prompt)
            summary = response.content.strip()
            return summary[:max_chars]
        except Exception as e:
            print(f"Summarization failed: {e}")
            # Fallback to truncation
            return text[:max_chars] + "..." if len(text) > max_chars else text
    
    def _generate_transcript_embedding(self, video_id: str) -> Dict[str, Any]:
        """Generate embedding for transcript summary."""
        try:
            # Get transcript segments
            segments = execute_query(
                """
                SELECT text, start_time_ms, end_time_ms, tokens, grammar_points
                FROM public.video_subtitles
                WHERE video_id = %s
                ORDER BY start_time_ms
                LIMIT 1000  -- Limit to prevent too large content
                """,
                (video_id,)
            )
            
            if not segments:
                return {"success": False, "error": "No transcript found"}
            
            # Combine all text
            full_transcript = " ".join([s["text"] for s in segments])
            
            # Generate summary
            summary = self._summarize_transcript(full_transcript)
            
            # Store embedding
            self._store_embedding(
                video_id=video_id,
                embedding_type="transcript_summary",
                content=full_transcript,
                content_summary=summary
            )
            
            # Analyze and update JLPT distribution
            jlpt_dist = self._analyze_jlpt_distribution(segments)
            
            # Update video with JLPT analysis
            dominant_level = max(jlpt_dist.items(), key=lambda x: x[1])[0] if jlpt_dist else None
            execute_query(
                """
                UPDATE public.videos
                SET jlpt_distribution = %s,
                    jlpt_level = %s,
                    updated_at = %s
                WHERE id = %s
                """,
                (json.dumps(jlpt_dist), dominant_level, datetime.now(timezone.utc), video_id),
                fetch=False
            )
            
            return {
                "success": True,
                "stats": {
                    "segment_count": len(segments),
                    "total_chars": len(full_transcript),
                    "jlpt_distribution": jlpt_dist
                }
            }
            
        except Exception as e:
            print(f"Transcript embedding failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _summarize_transcript(self, transcript: str) -> str:
        """Generate a summary of the video transcript."""
        try:
            llm = self._get_llm()
            prompt = f"""Summarize this Japanese video transcript in English. 
Focus on the main topics and key vocabulary:

Transcript (first 3000 chars):
{transcript[:3000]}

Summary (2-3 sentences about what this video teaches):"""
            
            response = llm.invoke(prompt)
            return response.content.strip()[:500]
        except Exception as e:
            print(f"Transcript summarization failed: {e}")
            return transcript[:500] + "..."
    
    def _analyze_jlpt_distribution(self, segments: List[Dict]) -> Dict[int, int]:
        """Analyze JLPT level distribution in transcript."""
        jlpt_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        for segment in segments:
            tokens = segment.get("tokens", [])
            if isinstance(tokens, str):
                tokens = json.loads(tokens)
            
            for token in tokens:
                jlpt = token.get("jlpt")
                if jlpt and 1 <= jlpt <= 5:
                    jlpt_counts[jlpt] += 1
        
        # Convert to percentages
        total = sum(jlpt_counts.values())
        if total > 0:
            return {k: round(v / total * 100) for k, v in jlpt_counts.items()}
        return jlpt_counts
    
    def search_videos(
        self,
        query: str,
        user_id: Optional[str] = None,
        jlpt_level: Optional[int] = None,
        limit: int = 10,
        min_similarity: float = 0.6
    ) -> List[VideoSearchResult]:
        """
        Search videos by semantic similarity to query.
        
        Args:
            query: Search query text
            user_id: Optional user ID to prioritize their library
            jlpt_level: Optional JLPT level filter
            limit: Max results
            min_similarity: Minimum similarity threshold
        
        Returns:
            List of video search results
        """
        try:
            embedder = self._get_embedder()
            query_embedding = embedder.embed_query(query)
            embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'
            
            # Build query
            conditions = ["1 - (ve.embedding <=> %s::vector) > %s"]
            params = [embedding_str, min_similarity]
            
            if jlpt_level:
                conditions.append("v.jlpt_level = %s")
                params.append(jlpt_level)
            
            where_clause = " AND ".join(conditions)
            
            # Get results ordered by similarity
            query = """
                SELECT DISTINCT ON (v.id)
                    v.id as video_id,
                    v.youtube_id,
                    v.title,
                    v.description,
                    v.channel_name,
                    v.thumbnail_url,
                    v.jlpt_level,
                    ve.embedding_type as match_type,
                    1 - (ve.embedding <=> %s::vector) as similarity
                FROM public.video_embeddings ve
                JOIN public.videos v ON v.id = ve.video_id
                WHERE {}
                ORDER BY v.id, similarity DESC
                LIMIT %s
            """.format(where_clause)
            rows = execute_query(query, tuple(params + [embedding_str, limit]))
            
            results = []
            for row in rows:
                results.append(VideoSearchResult(
                    video_id=str(row["video_id"]),
                    youtube_id=row.get("youtube_id"),
                    title=row["title"],
                    description=row.get("description"),
                    channel_name=row.get("channel_name"),
                    thumbnail_url=row.get("thumbnail_url"),
                    jlpt_level=row.get("jlpt_level"),
                    similarity_score=row["similarity"],
                    match_type=row["match_type"]
                ))
            
            return results
            
        except Exception as e:
            print(f"Video search failed: {e}")
            return []
    
    def find_similar_videos(
        self,
        video_id: str,
        limit: int = 5,
        min_similarity: float = 0.7
    ) -> List[VideoSearchResult]:
        """Find videos similar to a given video."""
        try:
            # Get the video's embeddings
            embeddings = execute_query(
                """
                SELECT embedding, embedding_type
                FROM public.video_embeddings
                WHERE video_id = %s
                """,
                (video_id,)
            )
            
            if not embeddings:
                return []
            
            # Use transcript summary embedding for similarity
            target_embedding = None
            for emb in embeddings:
                if emb["embedding_type"] == "transcript_summary":
                    target_embedding = emb["embedding"]
                    break
            
            if not target_embedding:
                target_embedding = embeddings[0]["embedding"]
            
            # Convert to string format for query
            if isinstance(target_embedding, list):
                embedding_str = '[' + ','.join(str(x) for x in target_embedding) + ']'
            else:
                embedding_str = str(target_embedding)
            
            # Find similar videos
            rows = execute_query(
                """
                SELECT DISTINCT ON (v.id)
                    v.id as video_id,
                    v.youtube_id,
                    v.title,
                    v.description,
                    v.channel_name,
                    v.thumbnail_url,
                    v.jlpt_level,
                    ve.embedding_type as match_type,
                    1 - (ve.embedding <=> %s::vector) as similarity
                FROM public.video_embeddings ve
                JOIN public.videos v ON v.id = ve.video_id
                WHERE v.id != %s
                AND 1 - (ve.embedding <=> %s::vector) > %s
                ORDER BY v.id, similarity DESC
                LIMIT %s
                """,
                (embedding_str, video_id, embedding_str, min_similarity, limit)
            )
            
            results = []
            for row in rows:
                results.append(VideoSearchResult(
                    video_id=str(row["video_id"]),
                    youtube_id=row.get("youtube_id"),
                    title=row["title"],
                    description=row.get("description"),
                    channel_name=row.get("channel_name"),
                    thumbnail_url=row.get("thumbnail_url"),
                    jlpt_level=row.get("jlpt_level"),
                    similarity_score=row["similarity"],
                    match_type=row["match_type"]
                ))
            
            return results
            
        except Exception as e:
            print(f"Similar video search failed: {e}")
            return []
    
    def get_video_segments_for_learning(
        self,
        video_id: str,
        target_ku_ids: List[str],
        context_window: int = 2  # Segments before and after
    ) -> List[Dict[str, Any]]:
        """
        Get transcript segments containing target vocabulary with context.
        
        Args:
            video_id: Video ID
            target_ku_ids: Knowledge unit IDs to find
            context_window: Number of segments before/after to include
        
        Returns:
            List of segment groups with context
        """
        if not target_ku_ids:
            return []
        
        ku_array = '{' + ','.join(target_ku_ids) + '}'
        
        # Find segments containing target KUs
        target_segments = execute_query(
            """
            SELECT id, start_time_ms, end_time_ms, text, tokens, grammar_points
            FROM public.video_subtitles
            WHERE video_id = %s
            AND (
                tokens @> ANY(ARRAY(
                    SELECT jsonb_build_array(jsonb_build_object('ku_id', ku_id::text))
                    FROM unnest(%s::uuid[]) AS ku_id
                ))
            )
            ORDER BY start_time_ms
            """,
            (video_id, ku_array)
        )
        
        if not target_segments:
            return []
        
        # Get all segments for context lookup
        all_segments = execute_query(
            """
            SELECT id, start_time_ms, end_time_ms, text, tokens
            FROM public.video_subtitles
            WHERE video_id = %s
            ORDER BY start_time_ms
            """,
            (video_id,)
        )
        
        # Build segment map
        segment_map = {s["id"]: s for s in all_segments}
        segment_list = list(segment_map.values())
        
        # Build context groups
        learning_segments = []
        for target in target_segments:
            target_idx = next(
                (i for i, s in enumerate(segment_list) if s["id"] == target["id"]),
                None
            )
            
            if target_idx is None:
                continue
            
            # Get context window
            start_idx = max(0, target_idx - context_window)
            end_idx = min(len(segment_list), target_idx + context_window + 1)
            context = segment_list[start_idx:end_idx]
            
            learning_segments.append({
                "target": target,
                "context_before": context[:target_idx - start_idx] if target_idx > start_idx else [],
                "context_after": context[target_idx - start_idx + 1:] if target_idx < end_idx - 1 else [],
                "start_time": target["start_time_ms"],
                "end_time": target["end_time_ms"]
            })
        
        return learning_segments
    
    def get_recommended_videos(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[VideoSearchResult]:
        """
        Get video recommendations based on user's learning progress.
        
        Recommends videos that:
        1. Match user's current JLPT level
        2. Contain vocabulary they're learning
        3. Are similar to videos they've watched
        """
        try:
            # Get user's current level from learning stats
            level_result = execute_single(
                """
                SELECT AVG(level) as avg_level
                FROM public.knowledge_units ku
                JOIN public.user_learning_states uls ON uls.ku_id = ku.id
                WHERE uls.user_id = %s AND uls.state IN ('learning', 'review')
                """,
                (user_id,)
            )
            
            avg_level = level_result["avg_level"] if level_result else 20
            target_jlpt = self._level_to_jlpt(int(avg_level)) if avg_level else 4
            
            # Get vocabulary the user is currently learning
            learning_vocab = execute_query(
                """
                SELECT ku.character, ku.id
                FROM public.knowledge_units ku
                JOIN public.user_learning_states uls ON uls.ku_id = ku.id
                WHERE uls.user_id = %s AND uls.state = 'learning'
                LIMIT 20
                """,
                (user_id,)
            )
            
            vocab_query = " ".join([v["character"] for v in learning_vocab if v["character"]])
            
            # If we have vocab, search for videos containing it
            if vocab_query:
                return self.search_videos(
                    query=vocab_query,
                    user_id=user_id,
                    jlpt_level=target_jlpt,
                    limit=limit,
                    min_similarity=0.5
                )
            
            # Otherwise, recommend by JLPT level
            rows = execute_query(
                """
                SELECT 
                    v.id as video_id,
                    v.youtube_id,
                    v.title,
                    v.description,
                    v.channel_name,
                    v.thumbnail_url,
                    v.jlpt_level,
                    'jlpt_match' as match_type,
                    0.5 as similarity
                FROM public.videos v
                LEFT JOIN public.user_video_library uvl 
                    ON uvl.video_id = v.id AND uvl.user_id = %s
                WHERE v.jlpt_level = %s
                AND uvl.id IS NULL  -- Not already in library
                ORDER BY v.created_at DESC
                LIMIT %s
                """,
                (user_id, target_jlpt, limit)
            )
            
            return [
                VideoSearchResult(
                    video_id=str(row["video_id"]),
                    youtube_id=row.get("youtube_id"),
                    title=row["title"],
                    description=row.get("description"),
                    channel_name=row.get("channel_name"),
                    thumbnail_url=row.get("thumbnail_url"),
                    jlpt_level=row.get("jlpt_level"),
                    similarity_score=row["similarity"],
                    match_type=row["match_type"]
                )
                for row in rows
            ]
            
        except Exception as e:
            print(f"Video recommendation failed: {e}")
            return []
    
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
    
    def delete_video_embeddings(self, video_id: str) -> bool:
        """Delete all embeddings for a video."""
        try:
            execute_query(
                "DELETE FROM public.video_embeddings WHERE video_id = %s",
                (video_id,),
                fetch=False
            )
            return True
        except Exception as e:
            print(f"Failed to delete embeddings: {e}")
            return False


# Singleton instance
_video_embeddings_service: Optional[VideoEmbeddingsService] = None


def get_video_embeddings_service() -> VideoEmbeddingsService:
    """Get the singleton video embeddings service instance."""
    global _video_embeddings_service
    if _video_embeddings_service is None:
        _video_embeddings_service = VideoEmbeddingsService()
    return _video_embeddings_service
