import requests


def test_homepage_smoke():
    # Quick smoke: ensure local dev server is reachable on project ports
    urls = ["http://localhost:43100", "http://localhost:43101", "http://localhost:43102"]
    ok = False
    for u in urls:
        try:
            r = requests.get(u, timeout=1)
            if r.status_code == 200:
                ok = True
                break
        except Exception:
            continue
    assert ok, "No reachable dev server on common ports"
