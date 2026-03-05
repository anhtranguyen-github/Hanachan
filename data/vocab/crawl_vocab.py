import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time
import logging
import random
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# =========================
# CONFIG
# =========================
BASE_DELAY = 1.0          # delay cơ bản giữa mỗi request (seconds)
JITTER = (0, 0.5)         # random thêm
BACKOFF_MULTIPLIER = 2.0  # khi bị 429
MAX_RETRIES = 10

# =========================
# LOGGING
# =========================
log_dir = "/home/tra01/project/hanachan_v2_final/data/vocab"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)
log_file = os.path.join(log_dir, "crawl_vocab.log")

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
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; rv:122.0) Gecko/20100101 Firefox/122.0',
]

write_lock = threading.Lock()
thread_local = threading.local()

def get_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
    return thread_local.session

# =========================
# UTILS
# =========================
def polite_sleep(multiplier=1.0):
    delay = (BASE_DELAY + random.uniform(*JITTER)) * multiplier
    time.sleep(delay)

# =========================
# CORE PARSER
# =========================
def parse_vocab_page(url):
    backoff = 1.0

    for attempt in range(1, MAX_RETRIES + 1):
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.wanikani.com/'
        }

        polite_sleep(backoff)

        try:
            session = get_session()
            response = session.get(url, headers=headers, timeout=15)

            if response.status_code == 429:
                logger.warning(f"429 Rate limit → backoff x{BACKOFF_MULTIPLIER} ({url})")
                backoff *= BACKOFF_MULTIPLIER
                continue

            if response.status_code != 200:
                logger.warning(f"Status {response.status_code} ({url})")
                continue

            content = response.text
            if "WaniKani" not in content:
                logger.warning(f"Invalid content ({url})")
                continue

            soup = BeautifulSoup(content, 'html.parser')
            data = {'url': url}

            # ===== Identity =====
            title = soup.find('title')
            if title and title.text and "/" in title.text:
                data['character'] = title.text.split('/')[-1].strip()

            level_link = soup.select_one('a.wk-button[href^="/level/"]')
            if level_link and level_link.get('href'):
                m = re.search(r'\d+', level_link['href'])
                if m:
                    data['level'] = int(m.group())

            # ===== Meaning =====
            m_sec = soup.select_one('.subject-section--meaning')
            if m_sec:
                data['meanings'] = {
                    'primary': [],
                    'alternatives': [],
                    'part_of_speech': [],
                    'mnemonic': '',
                    'hint': ''
                }

                for div in m_sec.select('.subject-section__meanings'):
                    title_tag = div.select_one('.subject-section__meanings-title')
                    if not title_tag:
                        continue
                    
                    title = title_tag.text.strip().lower()
                    items_tag = div.select_one('.subject-section__meanings-items')
                    if not items_tag:
                        continue
                        
                    items = [m.strip() for m in items_tag.text.split(',')]
                    
                    if 'primary' in title:
                        data['meanings']['primary'] = items
                    elif 'alternative' in title:
                        data['meanings']['alternatives'] = items
                    elif 'word type' in title or 'part of speech' in title:
                        data['meanings']['part_of_speech'] = items

                data['meanings']['mnemonic'] = "\n\n".join(
                    b.get_text(" ", strip=True)
                    for b in m_sec.select('.subject-section__text')
                )

                hint = m_sec.select_one('.wk-hint__text, .subject-hint__text')
                if hint:
                    data['meanings']['hint'] = hint.get_text(" ", strip=True)

            # ===== Reading =====
            r_sec = soup.select_one('.subject-section--reading')
            if r_sec:
                data['readings'] = {
                    'primary': '',
                    'mnemonic': '',
                    'hint': '',
                    'audio': []
                }

                r_items = r_sec.select_one('.reading-with-audio__reading')
                if r_items:
                    data['readings']['primary'] = r_items.text.strip()

                data['readings']['mnemonic'] = "\n\n".join(
                    b.get_text(" ", strip=True)
                    for b in r_sec.select('.subject-section__text')
                )

                hint = r_sec.select_one('.wk-hint__text, .subject-hint__text')
                if hint:
                    data['readings']['hint'] = hint.get_text(" ", strip=True)

                # Audio
                for audio in r_sec.select('.reading-with-audio__audio-items li audio source'):
                    if audio.get('src'):
                        data['readings']['audio'].append({
                            'url': audio['src'],
                            'content_type': audio.get('type')
                        })

            # ===== Context Sentences =====
            c_sec = soup.select_one('.subject-section--context')
            data['context_sentences'] = []
            if c_sec:
                for group in c_sec.select('.subject-section__text--grouped'):
                    ja = group.select_one('p[lang="ja"]')
                    en = group.select_one('p:not([lang="ja"])')
                    if ja and en:
                        data['context_sentences'].append({
                            'ja': ja.get_text(strip=True),
                            'en': en.get_text(strip=True)
                        })

            # ===== Kanji Components =====
            comp_sec = soup.select_one('.subject-section--components')
            data['components'] = []
            if comp_sec:
                for c in comp_sec.select('.subject-character__characters'):
                    data['components'].append(c.text.strip())

            return data

        except Exception as e:
            logger.error(f"Error attempt {attempt} ({url}): {e}")
            backoff *= BACKOFF_MULTIPLIER

    return None

# =========================
# WORKER
# =========================
def worker(url, f_out, f_check):
    data = parse_vocab_page(url)
    if data and 'character' in data:
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
def bulk_crawl(workers=1):
    input_f = "/home/tra01/project/hanachan_v2_final/data/vocab.jsonl"
    output_f = "/home/tra01/project/hanachan_v2_final/data/vocab/vocab_full_data.jsonl"
    checkp_f = "/home/tra01/project/hanachan_v2_final/data/vocab/crawl_vocab_checkpoint.txt"

    if not os.path.exists(os.path.dirname(output_f)):
        os.makedirs(os.path.dirname(output_f))

    done = set(open(checkp_f).read().splitlines()) if os.path.exists(checkp_f) else set()
    urls = []
    with open(input_f, "r", encoding="utf-8") as f:
        for line in f:
            try:
                line_data = json.loads(line)
                url = line_data.get('url')
                if url and url not in done:
                    urls.append(url)
            except Exception as e:
                logger.error(f"Error parsing json line: {e}")
                continue

    logger.info(f"Start crawl {len(urls)} URLs | workers={workers}")

    with open(output_f, 'a', encoding='utf-8') as f_out, open(checkp_f, 'a') as f_check:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(worker, u, f_out, f_check) for u in urls]
            done_count = 0
            for fut in as_completed(futures):
                if fut.result():
                    done_count += 1
                    if done_count % 5 == 0:
                        logger.info(f"Progress {done_count}/{len(urls)}")

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_url = sys.argv[2] if len(sys.argv) > 2 else "https://www.wanikani.com/vocabulary/%E6%8A%9C%E3%81%8F"
        print(json.dumps(
            parse_vocab_page(test_url),
            ensure_ascii=False,
            indent=2
        ))
    else:
        bulk_crawl(workers=5)
