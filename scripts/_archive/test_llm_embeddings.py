#!/usr/bin/env python3
"""Simple connectivity tests for LLM and embedding endpoints.

Usage: run from the repository root. Expects env vars to be set, e.g.
  DEFAULT_LLM_MODEL, LLM_BASE_URL, OPENAI_API_KEY, JINA_API_KEY
The script will try to use environment variables first and falls back
to reading src/fastapi/.env if needed.
"""
import os
import json
import requests
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / "src" / "fastapi" / ".env"


def load_env_from_file(path):
    if not path.exists():
        return {}
    result = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        result[k.strip()] = v.strip()
    return result


def test_llm(base_url, model, api_key=None):
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Say hello in one word."}],
        "max_tokens": 16,
    }
    r = None
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=20)
        r.raise_for_status()
        print("LLM response OK:", r.status_code)
        try:
            print(json.dumps(r.json(), indent=2, ensure_ascii=False)[:2000])
        except Exception:
            print(r.text[:2000])
        return True
    except Exception as e:
        print("LLM request failed:", e)
        if r is not None:
            try:
                print('server response:', r.text[:1000])
            except Exception:
                pass
        return False


def test_embeddings(jina_api_key):
    url = "https://api.jina.ai/v1/embeddings"
    headers = {"Content-Type": "application/json"}
    if jina_api_key:
        headers["Authorization"] = f"Bearer {jina_api_key}"
    data = {
        "model": "jina-embeddings-v3",
        "task": "text-matching",
        "input": ["hello world", "こんにちは"]
    }
    r = None
    try:
        r = requests.post(url, headers=headers, json=data, timeout=20)
        r.raise_for_status()
        print("Embeddings response OK:", r.status_code)
        print(json.dumps(r.json(), indent=2, ensure_ascii=False)[:2000])
        return True
    except Exception as e:
        print("Embeddings request failed:", e)
        if r is not None:
            try:
                print('server response:', r.text[:1000])
            except Exception:
                pass
        return False


def main():
    env = dict(os.environ)
    file_env = load_env_from_file(ENV_PATH)
    # prefer real environment variables, fall back to file
    LLM_BASE_URL = env.get("LLM_BASE_URL") or file_env.get("LLM_BASE_URL")
    DEFAULT_LLM_MODEL = env.get("DEFAULT_LLM_MODEL") or file_env.get("DEFAULT_LLM_MODEL")
    OPENAI_API_KEY = env.get("OPENAI_API_KEY") or file_env.get("OPENAI_API_KEY")
    JINA_API_KEY = env.get("JINA_API_KEY") or file_env.get("JINA_API_KEY")

    success = True
    if not LLM_BASE_URL or not DEFAULT_LLM_MODEL:
        print("Missing LLM_BASE_URL or DEFAULT_LLM_MODEL. Set env vars or update src/fastapi/.env")
        success = False
    else:
        print(f"Testing LLM at {LLM_BASE_URL} with model {DEFAULT_LLM_MODEL}")
        ok = test_llm(LLM_BASE_URL, DEFAULT_LLM_MODEL, api_key=OPENAI_API_KEY)
        success = success and ok

    print("--\nTesting embeddings (Jina)")
    if not JINA_API_KEY:
        print("No JINA_API_KEY found in environment or .env; set JINA_API_KEY to test embeddings")
    else:
        ok2 = test_embeddings(JINA_API_KEY)
        success = success and ok2

    if success:
        print("\nAll checks passed (or attempted).")
    else:
        print("\nOne or more checks failed. See logs above.")


if __name__ == "__main__":
    main()
