import logging
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.supabase import supabase
from app.core.llm import make_embedding_model, make_llm

logger = logging.getLogger(__name__)


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
        res = supabase.table("videos").select("*").eq("id", video_id).execute()
        video = res.data[0] if res.data else None
        
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
            
            now = datetime.now(timezone.utc).isoformat()
            
            upsert_data = {
                "video_id": video_id,
                "embedding_type": embedding_type,
                "embedding": embedding,
                "embedding_model": 'text-embedding-3-small',
                "content_summary": content_summary,
                "created_at": now,
                "updated_at": now
            }
            
            supabase.table("video_embeddings").upsert(upsert_data, on_conflict="video_id,embedding_type").execute()
        except Exception as e:
            logger.error(f"Failed to store embedding for video {video_id}: {e}")
            raise
    
    def _summarize_text(self, text: str, max_chars: int = 500) -> str:
        """Summarize text using LLM."""
        try:
            llm = self._get_llm()
            prompt = f"""Summarize the following text concisely in English, keeping the key points:

Text: {text[:3000]}

Summary (max 3 sentences):"""
            
            response = llm.invoke(prompt)
            summary = response.content.strip() if hasattr(response, 'content') else str(response)
            return summary[:max_chars]
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            # Fallback to truncation
            return text[:max_chars] + "..." if len(text) > max_chars else text
    
    def _generate_transcript_embedding(self, video_id: str) -> Dict[str, Any]:
        """Generate embedding for transcript summary."""
        try:
            # Get transcript segments
            res = supabase.table("video_subtitles") \
                .select("text, start_time_ms, end_time_ms, tokens, grammar_points") \
                .eq("video_id", video_id) \
                .order("start_time_ms") \
                .limit(1000) \
                .execute()
            
            segments = res.data or []
            
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
            dominant_level = max(jlpt_dist.items(), key=lambda x: x[1])[0] if jlpt_dist else None
            
            # Update video with JLPT analysis
            supabase.table("videos").update({
                "jlpt_distribution": jlpt_dist,
                "jlpt_level": dominant_level,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", video_id).execute()
            
            return {
                "success": True,
                "stats": {
                    "segment_count": len(segments),
                    "total_chars": len(full_transcript),
                    "jlpt_distribution": jlpt_dist
                }
            }
            
        except Exception as e:
            logger.error(f"Transcript embedding failed: {e}")
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
            summary = response.content.strip() if hasattr(response, 'content') else str(response)
            return summary[:500]
        except Exception as e:
            logger.error(f"Transcript summarization failed: {e}")
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
        """Search videos by semantic similarity."""
        try:
            embedder = self._get_embedder()
            query_embedding = embedder.embed_query(query)
            
            # Using Supabase RPC for vector search
            # Assumes 'match_videos' RPC exists
            params = {
                "query_embedding": query_embedding,
                "match_threshold": min_similarity,
                "match_count": limit
            }
            if jlpt_level:
                params["target_jlpt"] = jlpt_level

            result = supabase.rpc("match_videos", params).execute()
            
            results = []
            for row in result.data or []:
                results.append(VideoSearchResult(
                    video_id=str(row["id"]),
                    youtube_id=row.get("youtube_id"),
                    title=row["title"],
                    description=row.get("description"),
                    channel_name=row.get("channel_name"),
                    thumbnail_url=row.get("thumbnail_url"),
                    jlpt_level=row.get("jlpt_level"),
                    similarity_score=row.get("similarity", 0.0),
                    match_type=row.get("match_type", "unknown")
                ))
            
            return results
        except Exception as e:
            logger.error(f"Video search failed: {e}")
            return []
    
    def find_similar_videos(
        self,
        video_id: str,
        limit: int = 5,
        min_similarity: float = 0.7
    ) -> List[VideoSearchResult]:
        """Find videos similar to a given video."""
        try:
            res = supabase.table("video_embeddings") \
                .select("embedding, embedding_type") \
                .eq("video_id", video_id) \
                .execute()
            
            embeddings = res.data or []
            if not embeddings:
                return []
            
            target_embedding = None
            for emb in embeddings:
                if emb["embedding_type"] == "transcript_summary":
                    target_embedding = emb["embedding"]
                    break
            if not target_embedding:
                target_embedding = embeddings[0]["embedding"]
            
            # Using Supabase RPC
            result = supabase.rpc("match_videos", {
                "query_embedding": target_embedding,
                "match_threshold": min_similarity,
                "match_count": limit + 1
            }).execute()
            
            results = []
            for row in result.data or []:
                if str(row["id"]) == video_id:
                    continue
                results.append(VideoSearchResult(
                    video_id=str(row["id"]),
                    youtube_id=row.get("youtube_id"),
                    title=row["title"],
                    description=row.get("description"),
                    channel_name=row.get("channel_name"),
                    thumbnail_url=row.get("thumbnail_url"),
                    jlpt_level=row.get("jlpt_level"),
                    similarity_score=row.get("similarity", 0.0),
                    match_type=row.get("match_type", "unknown")
                ))
            
            return results[:limit]
        except Exception as e:
            logger.error(f"Similar video search failed: {e}")
            return []
    
    def get_video_segments_for_learning(
        self,
        video_id: str,
        target_ku_ids: List[str],
        context_window: int = 2
    ) -> List[Dict[str, Any]]:
        """Get transcript segments containing target vocabulary with context."""
        if not target_ku_ids:
            return []
        
        # This is a bit complex for a single Supabase query due to the nested JSON path check.
        # We'll fetch segments and filter in-memory if needed, or use a specific RPC if performance is key.
        # For now, let's fetch all segments for the video.
        res = supabase.table("video_subtitles") \
            .select("id, start_time_ms, end_time_ms, text, tokens, grammar_points") \
            .eq("video_id", video_id) \
            .order("start_time_ms") \
            .execute()
            
        all_segments = res.data or []
        target_ku_ids_str = [str(ku_id) for ku_id in target_ku_ids]
        
        learning_segments = []
        for i, segment in enumerate(all_segments):
            tokens = segment.get("tokens", [])
            if isinstance(tokens, str):
                tokens = json.loads(tokens)
            
            contains_target = False
            for token in tokens:
                if str(token.get("ku_id")) in target_ku_ids_str:
                    contains_target = True
                    break
            
            if contains_target:
                start_window = max(0, i - context_window)
                end_window = min(len(all_segments), i + context_window + 1)
                
                learning_segments.append({
                    "target": segment,
                    "context_before": all_segments[start_window:i],
                    "context_after": all_segments[i+1:end_window],
                    "start_time": segment["start_time_ms"],
                    "end_time": segment["end_time_ms"]
                })
                
        return learning_segments
    
    def get_recommended_videos(
        self,
        user_id: str,
        limit: int = 5
    ) -> List[VideoSearchResult]:
        """Get video recommendations based on user's learning progress."""
        try:
            # Get user's current level
            # We'll need a query across knowledge_units and user_learning_states
            # Since Supabase SDK doesn't support complex joins well across different tables with aggregation,
            # we might use RPC or consecutive queries.
            
            # Simple approach: get some learning items
            res = supabase.table("user_learning_states") \
                .select("ku:knowledge_units(level, character)") \
                .eq("user_id", user_id) \
                .eq("state", "learning") \
                .limit(20) \
                .execute()
                
            learning_data = res.data or []
            if not learning_data:
                # Default recommendation
                res = supabase.table("videos").select("*").order("created_at", desc=True).limit(limit).execute()
                return [VideoSearchResult(
                    video_id=str(row["id"]),
                    youtube_id=row.get("youtube_id"),
                    title=row["title"],
                    description=row.get("description"),
                    channel_name=row.get("channel_name"),
                    thumbnail_url=row.get("thumbnail_url"),
                    jlpt_level=row.get("jlpt_level"),
                    similarity_score=0.5,
                    match_type="default"
                ) for row in res.data or []]

            chars = [d["ku"]["character"] for d in learning_data if d.get("ku")]
            avg_level = sum([d["ku"]["level"] for d in learning_data if d.get("ku")]) / len(learning_data)
            target_jlpt = self._level_to_jlpt(int(avg_level))
            
            return self.search_videos(
                query=" ".join(chars),
                user_id=user_id,
                jlpt_level=target_jlpt,
                limit=limit
            )
            
        except Exception as e:
            logger.error(f"Video recommendation failed: {e}")
            return []
    
    def _level_to_jlpt(self, level: int) -> int:
        """Convert curriculum level (1-60) to JLPT level (1-5)."""
        if level <= 10: return 5
        elif level <= 20: return 4
        elif level <= 35: return 3
        elif level <= 50: return 2
        else: return 1
    
    def delete_video_embeddings(self, video_id: str) -> bool:
        """Delete all embeddings for a video."""
        try:
            supabase.table("video_embeddings").delete().eq("video_id", video_id).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete embeddings: {e}")
            return False


# Singleton instance
_video_embeddings_service: Optional[VideoEmbeddingsService] = None


def get_video_embeddings_service() -> VideoEmbeddingsService:
    """Get the singleton video embeddings service instance."""
    global _video_embeddings_service
    if _video_embeddings_service is None:
        _video_embeddings_service = VideoEmbeddingsService()
    return _video_embeddings_service
