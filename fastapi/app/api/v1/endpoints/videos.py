from fastapi import APIRouter, HTTPException
from urllib.parse import urlparse
import yt_dlp

router = APIRouter()

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
