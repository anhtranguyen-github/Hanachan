from __future__ import annotations

from unittest.mock import AsyncMock

import pytest
from openai import APIConnectionError

from app.cli.chat import _chat_loop, _format_chat_error, build_parser


def test_chat_cli_parser_defaults():
    args = build_parser().parse_args([])

    assert args.user_id == "cli-user"
    assert args.jwt == "cli-local"
    assert args.session_id is None
    assert args.persist is False


def test_chat_cli_parser_accepts_explicit_session():
    args = build_parser().parse_args(["--user-id", "u1", "--jwt", "token", "--session-id", "s1"])

    assert args.user_id == "u1"
    assert args.jwt == "token"
    assert args.session_id == "s1"


@pytest.mark.asyncio
async def test_chat_cli_loop_survives_agent_error(monkeypatch, capsys):
    inputs = iter(["hello", "/exit"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))
    monkeypatch.setattr("app.cli.chat._probe_llm_endpoint", AsyncMock(return_value=None))
    monkeypatch.setattr(
        "app.cli.chat.run_chat",
        AsyncMock(side_effect=RuntimeError("Connection error.")),
    )

    await _chat_loop("cli-user", "cli-jwt", "cli-session", timeout=1.0, debug=False, persist=False)

    out = capsys.readouterr().out
    assert "[hanachan] session=cli-session" in out
    assert "[hanachan] local mode: persistence disabled" in out
    assert "hana> error: RuntimeError: Connection error." in out


@pytest.mark.asyncio
async def test_chat_cli_loop_prints_agent_reply(monkeypatch, capsys):
    inputs = iter(["hello", "/exit"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))
    monkeypatch.setattr("app.cli.chat._probe_llm_endpoint", AsyncMock(return_value=None))
    monkeypatch.setattr(
        "app.cli.chat.run_chat",
        AsyncMock(return_value={"response": "こんにちは"}),
    )

    await _chat_loop("cli-user", "cli-jwt", "cli-session", timeout=1.0, debug=False, persist=False)

    out = capsys.readouterr().out
    assert "hana> こんにちは" in out


def test_chat_cli_formats_api_connection_error_with_hint():
    message = _format_chat_error(APIConnectionError(message="Connection error.", request=None))

    assert "localhost:20128" in message or "localhost:43120" in message
    assert "./run.sh dev" in message


@pytest.mark.asyncio
async def test_chat_cli_prints_startup_warning_for_unreachable_llm(monkeypatch, capsys):
    inputs = iter(["/exit"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))
    monkeypatch.setattr(
        "app.cli.chat._probe_llm_endpoint",
        AsyncMock(return_value="All connection attempts failed"),
    )

    await _chat_loop("cli-user", "cli-jwt", "cli-session", timeout=1.0, debug=False, persist=False)

    out = capsys.readouterr().out
    assert "[hanachan] warning:" in out
    assert "./run.sh dev" in out
