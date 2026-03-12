from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.mcp.client import McpClient
from app.core.config import settings

@pytest.mark.asyncio
async def test_mcp_universal_client_init():
    """Test McpClient initialization"""
    url = "http://test-mcp:6100"
    client = McpClient(url)
    assert client.url == url

@pytest.mark.asyncio
async def test_mcp_call_tool_success():
    """Test tool call successfully invoking the mock SSE client"""
    client = McpClient("http://test-mcp:6100")
    jwt = "test-jwt-token"

    # Create mock result object
    mock_content = MagicMock()
    mock_content.text = '{"status": "success"}'

    mock_result = MagicMock()
    mock_result.content = [mock_content]

    # Mock the session object
    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.call_tool = AsyncMock(return_value=mock_result)

    with (
        patch("app.mcp.client.sse_client") as mock_sse_client,
        patch("app.mcp.client.ClientSession") as mock_client_session,
    ):
        # Setup context managers
        mock_sse_ctx = AsyncMock()
        mock_sse_ctx.__aenter__.return_value = (AsyncMock(), AsyncMock())
        mock_sse_client.return_value = mock_sse_ctx

        mock_session_ctx = AsyncMock()
        mock_session_ctx.__aenter__.return_value = mock_session
        mock_client_session.return_value = mock_session_ctx

        response = await client.call_tool("test_tool", {"arg1": "val1"}, jwt=jwt)

        assert response == '{"status": "success"}'
        mock_session.initialize.assert_awaited_once()
        mock_session.call_tool.assert_awaited_once_with("test_tool", {"arg1": "val1"})

@pytest.mark.asyncio
async def test_mcp_call_tool_failure():
    """Test tool call handles failures properly"""
    client = McpClient("http://test-mcp:6100")

    with patch("app.mcp.client.sse_client", side_effect=Exception("Network Error")):
        with pytest.raises(Exception, match="Network Error"):
            await client.call_tool("test_tool", {}, jwt="jwt")
