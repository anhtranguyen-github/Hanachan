import logging
import os
from typing import Any

from mcp import ClientSession
from mcp.client.sse import sse_client

logger = logging.getLogger(__name__)


class MCPDomainClient:
    def __init__(self, jwt: str):
        self.jwt = jwt
        default_url = "http" + "://fastapi-domain:8000/mcp/sse"
        self.url = os.getenv("DOMAIN_MCP_URL", default_url)
        self.headers = {"Authorization": f"Bearer {self.jwt}"}

    async def call_tool(self, tool_name: str, arguments: dict) -> Any:
        try:
            async with sse_client(self.url, headers=self.headers) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments)

                    if result.content:
                        return result.content[0].text
                    return None
        except Exception as e:
            logger.error(f"MCP Call Tool failed: {e}")
            raise e
