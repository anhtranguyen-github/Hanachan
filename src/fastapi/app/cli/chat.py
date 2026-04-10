from __future__ import annotations

import argparse
import asyncio
import traceback
import uuid
import warnings
from urllib.parse import urlparse

import httpx
from openai import APIConnectionError

from app.agents.tutor_agent import run_chat
from app.core.config import settings


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Interactive CLI for the Hanachan chatbot.")
    parser.add_argument(
        "--user-id",
        default="a1111111-1111-1111-1111-111111111111",
        help="Logical user id passed to the agent. Defaults to a standard test UUID.",
    )
    parser.add_argument(
        "--jwt",
        default="cli-local",
        help="JWT value passed through to the agent. Defaults to a local placeholder.",
    )
    parser.add_argument(
        "--session-id",
        default=None,
        help="Optional existing chat session id. If omitted, a new UUID is created.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=60.0,
        help="Per-message timeout in seconds. Defaults to 60.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print full exception traces instead of concise CLI errors.",
    )
    parser.add_argument(
        "--no-persist",
        action="store_false",
        dest="persist",
        help="Disable live thread/memory persistence.",
    )
    parser.set_defaults(persist=True)
    return parser


def _configured_llm_base_url() -> str | None:
    return settings.llm_api_base or settings.llm_base_url or None


def _is_local_omniroute(base_url: str | None) -> bool:
    if not base_url:
        return False
    parsed = urlparse(base_url)
    return parsed.hostname in {"127.0.0.1", "localhost"}


def _llm_connection_hint(base_url: str | None) -> str:
    if _is_local_omniroute(base_url):
        parsed = urlparse(base_url)
        port = parsed.port or 20128
        return (
            f"configured LLM endpoint {base_url} is unreachable. "
            "This repo expects a local OmniRoute server there. "
            "Start it with `./run.sh dev` from the repo root, or run "
            f"`omniroute --port {port} --no-open`."
        )
    if base_url:
        return f"configured LLM endpoint {base_url} is unreachable."
    return "no LLM endpoint is configured."


async def _probe_llm_endpoint(base_url: str | None, *, timeout: float = 1.5) -> str | None:
    if not base_url:
        return "no LLM endpoint configured"

    probe_url = f"{base_url.rstrip('/')}/models"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(probe_url)
            if response.status_code < 500:
                return None
            return f"LLM endpoint probe returned HTTP {response.status_code}"
    except httpx.HTTPError as exc:
        return str(exc)


def _format_chat_error(exc: Exception) -> str:
    base_url = _configured_llm_base_url()
    if isinstance(exc, APIConnectionError):
        return _llm_connection_hint(base_url)
    return f"{type(exc).__name__}: {exc}"


async def _chat_loop(
    user_id: str,
    jwt: str,
    session_id: str,
    *,
    timeout: float,
    debug: bool,
    persist: bool,
) -> None:
    base_url = _configured_llm_base_url()
    probe_error = await _probe_llm_endpoint(base_url)

    print(f"[hanachan] session={session_id}")
    print("[hanachan] commands: /exit, /new, /session <id>")
    if not persist:
        print("[hanachan] warning: persistence disabled via flag")
    if probe_error:
        print(f"[hanachan] warning: {_llm_connection_hint(base_url)}")

    while True:
        try:
            user_input = input("you> ").strip()
        except EOFError:
            print()
            break
        except KeyboardInterrupt:
            print()
            break

        if not user_input:
            continue
        if user_input == "/exit":
            break
        if user_input == "/new":
            session_id = str(uuid.uuid4())
            print(f"[hanachan] session={session_id}")
            continue
        if user_input.startswith("/session "):
            _, _, raw_session = user_input.partition(" ")
            session_id = raw_session.strip() or session_id
            print(f"[hanachan] session={session_id}")
            continue

        try:
            result = await asyncio.wait_for(
                run_chat(
                    user_id=user_id,
                    jwt=jwt,
                    message=user_input,
                    session_id=session_id,
                    persist_artifacts=persist,
                ),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            print(f"hana> request timed out after {timeout:.1f}s")
            continue
        except Exception as exc:
            if debug:
                traceback.print_exc()
            else:
                print(f"hana> error: {_format_chat_error(exc)}")
            continue

        print(f"hana> {result['response']}")


def main() -> None:
    warnings.filterwarnings("ignore", message=r"Pydantic serializer warnings:.*", category=UserWarning)
    args = build_parser().parse_args()
    session_id = args.session_id or str(uuid.uuid4())
    asyncio.run(
        _chat_loop(
            args.user_id,
            args.jwt,
            session_id,
            timeout=args.timeout,
            debug=args.debug,
            persist=args.persist,
        )
    )


if __name__ == "__main__":
    main()
