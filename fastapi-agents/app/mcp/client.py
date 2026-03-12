import logging
from typing import Any

from mcp import ClientSession
from mcp.client.sse import sse_client

logger = logging.getLogger(__name__)


class McpClient:
    """
    Universal MCP client for calling tools on any MCP Server via SSE.

    Security:
    - Forwards the end-user Supabase JWT in Authorization header.
    - Statutory warnings: Never pass user_id manually if the server handles it via JWT.
    """

    def __init__(self, mcp_url: str):
        """
        Initialize the MCP client with a target server URL.

        Args:
            mcp_url: The SSE endpoint of the MCP server.
        """
        self.url = mcp_url

    async def call_tool(
        self, tool_name: str, arguments: dict[str, Any] | None = None, *, jwt: str
    ) -> Any:
        """
        Calls a tool on the MCP server with a specific user's JWT.

        Args:
            tool_name: The name of the tool to execute.
            arguments: The arguments to pass to the tool.
            jwt: The bearer token for authentication.
        """
        headers = {"Authorization": f"Bearer {jwt}", "Content-Type": "application/json"}

        try:
            async with sse_client(self.url, headers=headers) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments or {})

                    if result.content:
                        # MCP returns a list of content items. Assume the first is text.
                        return result.content[0].text
                    return None
        except Exception as e:
            logger.error(f"Universal MCP Call Tool failed [Tool: {tool_name}]: {e}")
            raise e
