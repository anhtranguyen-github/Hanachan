import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time
import logging
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# =========================
# CONFIG
# =========================
BASE_DELAY = 1.0
JITTER = (0, 0.5)
MAX_RETRIES = 5

# =========================
# LOGGING
# =========================
log_dir = "/home/tra01/project/hanachan_v2_final/data/grammar"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
log_file = os.path.join(log_dir, "crawl_grammar.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36'
]

write_lock = threading.Lock()

BACKOFF_MULTIPLIER = 2.0
thread_local = threading.local()

def get_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
    return thread_local.session

# =========================
# CORE PARSER
# =========================
def parse_grammar_page(url):
    backoff = 1.0

    for attempt in range(1, MAX_RETRIES + 1):
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept-Language': 'en-US,en;q=0.9',
        }

        time.sleep((BASE_DELAY + random.uniform(*JITTER)) * backoff)

        try:
            session = get_session()
            response = session.get(url, headers=headers, timeout=15)
            
            if response.status_code == 429:
                logger.warning(f"429 Rate limit → backoff x{BACKOFF_MULTIPLIER} ({url})")
                backoff *= BACKOFF_MULTIPLIER
                continue

            if response.status_code != 200:
                logger.warning(f"Status {response.status_code} ({url})")
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            next_data_script = soup.find('script', id='__NEXT_DATA__')
            
            if not next_data_script:
                logger.warning(f"No __NEXT_DATA__ found ({url})")
                return None

            full_data = json.loads(next_data_script.string)
            page_props = full_data.get('props', {}).get('pageProps', {})
            gp = page_props.get('reviewable', {})

            if not gp:
                logger.warning(f"No grammar data in JSON ({url})")
                return None

            data = {
                'url': url,
                'id': gp.get('id'),
                'title': gp.get('title'),
                'meaning': gp.get('meaning'),
                'level': gp.get('level'),
                'nuance': {
                    'ja': gp.get('nuance'),
                    'en': gp.get('nuance_translation')
                },
                'details': {
                    'part_of_speech': gp.get('part_of_speech_translation'),
                    'word_type': gp.get('word_type_translation'),
                    'register': gp.get('register_translation'),
                    'rare_kanji': gp.get('rare_kanji_warning'),
                    'caution': gp.get('caution'),
                    'metadata': gp.get('metadata'),
                    'supplemental_links': []
                },
                'structure': {
                    'casual': gp.get('casual_structure'),
                    'polite': gp.get('polite_structure')
                },
                'about': [],
                'examples': [],
                'synonyms': [],
                'antonyms': [],
                'related': []
            }

            included = page_props.get('included', {})

            # 1. Details - Supplemental Links
            for link in included.get('supplementalLinks', []):
                data['details']['supplemental_links'].append({
                    'site': link.get('site'),
                    'description': link.get('description'),
                    'url': link.get('link')
                })

            # 2. About section (Writeups)
            for w in included.get('writeups', []):
                data['about'].append({
                    'id': w.get('id'),
                    'body': w.get('body')
                })

            # 3. Examples (Study Questions)
            sq_list = included.get('studyQuestions', [])
            for sq in sq_list:
                raw_content = sq.get('content', '')
                answer = sq.get('answer', '')
                # Replace blank with answer for full sentence
                full_ja_html = raw_content.replace('____', f"<strong>{answer}</strong>")
                clean_ja = BeautifulSoup(full_ja_html, 'html.parser').get_text()
                
                clean_en = BeautifulSoup(sq.get('translation', ''), 'html.parser').get_text()

                data['examples'].append({
                    'japanese_html': full_ja_html,
                    'japanese_clean': clean_ja,
                    'english': clean_en,
                    'audio': {
                        'female': sq.get('female_audio_url'),
                        'male': sq.get('male_audio_url')
                    }
                })

            # 4. Relationships (Synonyms, Antonyms, Related)
            related_raw = included.get('relatedContents', [])
            for r in related_raw:
                rel_type = r.get('relationship_type', 'related')
                first = r.get('first_relatable', {})
                second = r.get('second_relatable', {})
                
                # Determine which one is the "other" grammar point
                other = first if second.get('id') == data['id'] else second
                
                if other.get('id') and other.get('title'):
                    rel_info = {
                        'id': other.get('id'),
                        'title': other.get('title'),
                        'slug': other.get('slug'),
                        'meaning': other.get('meaning'),
                        'level': other.get('level'),
                        'comparison': r.get('body', '')  # The explanation of the relationship
                    }
                    
                    if rel_type == 'synonym':
                        data['synonyms'].append(rel_info)
                    elif rel_type == 'antonym':
                        data['antonyms'].append(rel_info)
                    else:
                        data['related'].append(rel_info)

            return data

        except Exception as e:
            logger.error(f"Error parsing attempt {attempt} for {url}: {e}")
            backoff *= BACKOFF_MULTIPLIER

    return None

# =========================
# WORKER
# =========================
def worker(url, f_out, f_check):
    data = parse_grammar_page(url)
    if data and 'title' in data:
        with write_lock:
            f_out.write(json.dumps(data, ensure_ascii=False) + '\n')
            f_out.flush()
            f_check.write(url + '\n')
            f_check.flush()
        return True
    return False

# =========================
# BULK
# =========================
def bulk_crawl(workers=5):
    input_f = "/home/tra01/project/hanachan_v2_final/data/grammar/grammar_urls.txt"
    output_f = "/home/tra01/project/hanachan_v2_final/data/grammar/grammar_full_data.jsonl"
    checkp_f = "/home/tra01/project/hanachan_v2_final/data/grammar/crawl_grammar_checkpoint.txt"

    if not os.path.exists(input_f):
        logger.error(f"Input file not found: {input_f}")
        return

    done = set(open(checkp_f).read().splitlines()) if os.path.exists(checkp_f) else set()
    urls = []
    with open(input_f, "r", encoding="utf-8") as f:
        for line in f:
            url = line.strip()
            if url and url not in done:
                urls.append(url)

    logger.info(f"Start crawl {len(urls)} grammar URLs | workers={workers}")

    with open(output_f, 'a', encoding='utf-8') as f_out, open(checkp_f, 'a') as f_check:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(worker, u, f_out, f_check) for u in urls]
            done_count = 0
            for fut in as_completed(futures):
                if fut.result():
                    done_count += 1
                    if done_count % 5 == 0:
                        logger.info(f"Progress {done_count}/{len(urls)}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        url = sys.argv[2] if len(sys.argv) > 2 else "https://bunpro.jp/grammar_points/%E3%81%9D%E3%81%93"
        result = parse_grammar_page(url)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        bulk_crawl(workers=5)
