from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from urllib.parse import urlparse
import yt_dlp

from ....core.security import require_auth
from ....services.video_embeddings import get_video_embeddings_service
from ....services.fsrs_service import get_fsrs_service

router = APIRouter()


@router.post("/{video_id}/embeddings")
async def generate_video_embeddings(
    video_id: str,
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Generate semantic embeddings for a video.
    This enables similarity search and recommendation features.
    """
    service = get_video_embeddings_service()
    result = service.generate_video_embeddings(video_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to generate embeddings"))
    
    return result


@router.get("/search")
async def search_videos(
    query: str,
    jlpt_level: Optional[int] = Query(None, ge=1, le=5),
    limit: int = Query(10, ge=1, le=50),
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Search videos by semantic similarity to a query.
    
    Args:
        query: Search query (can be topic, vocabulary, or grammar point)
        jlpt_level: Optional JLPT level filter
        limit: Maximum results
    """
    service = get_video_embeddings_service()
    results = service.search_videos(
        query=query,
        user_id=str(user["id"]),
        jlpt_level=jlpt_level,
        limit=limit
    )
    
    return {
        "results": [r.model_dump() for r in results],
        "query": query,
        "total": len(results)
    }


@router.get("/{video_id}/similar")
async def get_similar_videos(
    video_id: str,
    limit: int = Query(5, ge=1, le=20),
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Find videos similar to the given video.
    """
    service = get_video_embeddings_service()
    results = service.find_similar_videos(video_id, limit=limit)
    
    return {
        "results": [r.model_dump() for r in results],
        "source_video_id": video_id,
        "total": len(results)
    }


@router.get("/recommendations")
async def get_video_recommendations(
    limit: int = Query(5, ge=1, le=20),
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get personalized video recommendations based on learning progress.
    """
    service = get_video_embeddings_service()
    results = service.get_recommended_videos(str(user["id"]), limit=limit)
    
    return {
        "results": [r.model_dump() for r in results],
        "total": len(results)
    }


@router.get("/{video_id}/learning-segments")
async def get_video_learning_segments(
    video_id: str,
    vocabulary: str = Query(..., description="Comma-separated vocabulary to find"),
    context_window: int = Query(2, ge=0, le=5),
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get video segments containing specific vocabulary.
    
    Args:
        vocabulary: Comma-separated list of words/kanji to find
        context_window: Number of segments before/after to include
    """
    from ....services.learning_service import search_kus
    
    service = get_video_embeddings_service()
    
    # Parse vocabulary into KU IDs
    vocab_items = [v.strip() for v in vocabulary.split(",")]
    ku_ids = []
    
    for vocab in vocab_items:
        ku_results = search_kus(vocab, limit=1)
        if ku_results:
            ku_ids.append(str(ku_results[0]["id"]))
    
    if not ku_ids:
        raise HTTPException(status_code=400, detail=f"Could not find knowledge units for: {vocabulary}")
    
    segments = service.get_video_segments_for_learning(
        video_id=video_id,
        target_ku_ids=ku_ids,
        context_window=context_window
    )
    
    return {
        "segments": segments,
        "target_vocabulary": vocab_items,
        "video_id": video_id
    }


@router.post("/{video_id}/review")
async def submit_video_review(
    video_id: str,
    rating: int = Query(..., ge=1, le=4),
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Submit an FSRS review for a video.
    
    Args:
        rating: 1=Again, 2=Hard, 3=Good, 4=Easy
    """
    service = get_fsrs_service()
    result = service.submit_review(
        user_id=str(user["id"]),
        item_id=video_id,
        item_type="video",
        rating=rating,
        facet="content"
    )
    
    return {
        "success": True,
        "result": result.model_dump()
    }


@router.get("/{video_id}/fsrs-status")
async def get_video_fsrs_status(
    video_id: str,
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get FSRS learning status for a video.
    """
    from ....core.database import execute_single
    
    status = execute_single(
        """
        SELECT 
            content_state as state,
            content_stability as stability,
            content_difficulty as difficulty,
            content_reps as reps,
            last_watched_at,
            next_review_at,
            watch_time_seconds,
            completion_percentage
        FROM public.user_video_progress
        WHERE user_id = %s AND video_id = %s
        """,
        (str(user["id"]), video_id)
    )
    
    if not status:
        return {
            "state": "new",
            "message": "Video not started yet"
        }
    
    return dict(status)


@router.get("/transcript/{youtube_id}")
async def get_video_transcript(youtube_id: str):
    """
    Fetch the Japanese transcript for a given YouTube video ID.
    If multiple languages exist, attempts to fetch 'ja'.
    """
    try:
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['ja'],
            'quiet': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_id, download=False)
            
            subs = info.get('subtitles', {})
            auto_subs = info.get('automatic_captions', {})
            
            # Prefer manual japanese subs, then auto japanese subs
            ja_subs = subs.get('ja') or subs.get('ja-JP') or auto_subs.get('ja') or auto_subs.get('ja-JP')
            
            if not ja_subs:
                raise HTTPException(status_code=404, detail="No Japanese transcript found")
                
            # Find the json3 format which contains parsed text and timestamps
            json3_sub = next((s for s in ja_subs if s.get('ext') == 'json3'), None)
            
            if not json3_sub:
                raise HTTPException(status_code=404, detail="No JSON3 transcript format found")
                
            import urllib.request
            import json
            
            # Validate URL scheme to prevent security issues (S310)
            url = json3_sub['url']
            parsed = urlparse(url)
            if parsed.scheme not in ('http', 'https'):
                raise HTTPException(status_code=400, detail="Only HTTP/HTTPS URLs are allowed")
            
            req = urllib.request.Request(url)  # noqa: S310
            with urllib.request.urlopen(req) as response:  # noqa: S310  # nosec B310
                if response.status != 200:
                    raise HTTPException(status_code=500, detail="Failed to download transcript data")
                json_data = json.loads(response.read().decode('utf-8'))
            
            # Initialize Tokenizer
            from janome.tokenizer import Tokenizer
            t = Tokenizer()
            
            # Convert JSON3 to flat text array
            transcript = []
            for event in json_data.get('events', []):
                if 'segs' in event and 'tStartMs' in event:
                    text = ''.join([seg.get('utf8', '') for seg in event['segs']])
                    if text.strip():
                        # Tokenize
                        tokens = []
                        for token in t.tokenize(text):
                            pos = token.part_of_speech.split(',')[0]
                            reading = token.reading if token.reading != '*' else token.surface
                            tokens.append({
                                'surface': token.surface,
                                'reading': reading,
                                'pos': pos
                            })
                            
                        transcript.append({
                            'text': text,
                            'start': event['tStartMs'] / 1000.0,
                            'duration': event.get('dDurationMs', 0) / 1000.0,
                            'tokens': tokens
                        })
                        
            return {"transcript": transcript}
        
    except Exception as e:
        print(f"Transcript Error for {youtube_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
