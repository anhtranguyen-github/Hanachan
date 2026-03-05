from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.mcp_domain_client import MCPDomainClient


@pytest.mark.asyncio
async def test_mcp_domain_client_init():
    """QA-Arch-MCP: Test MCPDomainClient URL and Auth Headers"""
    jwt = "test-jwt-token"
    client = MCPDomainClient(jwt)
    assert client.headers["Authorization"] == f"Bearer {jwt}"
    assert "DOMAIN_MCP_URL" in client.url or client.url == "http://fastapi-domain:8001/mcp/sse"

@pytest.mark.asyncio
async def test_mcp_call_tool_success():
    """QA-Arch-MCP: Test tool call successfully invoking the mock SSE client"""
    client = MCPDomainClient("jwt")
    
    # Create mock result object
    mock_content = MagicMock()
    mock_content.text = '{"status": "success", "data": 123}'
    
    mock_result = MagicMock()
    mock_result.content = [mock_content]

    # Mock the session object
    mock_session = AsyncMock()
    mock_session.initialize = AsyncMock()
    mock_session.call_tool = AsyncMock(return_value=mock_result)

    with patch("app.services.mcp_domain_client.sse_client") as mock_sse_client, \
         patch("app.services.mcp_domain_client.ClientSession") as mock_client_session:
        
        # Setup context managers
        mock_sse_ctx = AsyncMock()
        mock_sse_ctx.__aenter__.return_value = (AsyncMock(), AsyncMock()) # mock read, write streams
        mock_sse_client.return_value = mock_sse_ctx
        
        mock_session_ctx = AsyncMock()
        mock_session_ctx.__aenter__.return_value = mock_session
        mock_client_session.return_value = mock_session_ctx
        
        response = await client.call_tool("test_tool", {"arg1": "val1"})
        
        assert response == '{"status": "success", "data": 123}'
        mock_session.initialize.assert_awaited_once()
        mock_session.call_tool.assert_awaited_once_with("test_tool", {"arg1": "val1"})

@pytest.mark.asyncio
async def test_mcp_call_tool_failure():
    """QA-Arch-MCP: Test tool call handles failures properly"""
    client = MCPDomainClient("jwt")
    
    with patch("app.services.mcp_domain_client.sse_client", side_effect=Exception("Network Error")):
        with pytest.raises(Exception, match="Network Error"):
            await client.call_tool("test_tool", {})
