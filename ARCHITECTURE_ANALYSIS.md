# Architecture Analysis & Cleanup Report - Hanachan Repository

## Date: 2026-03-05
## Role: Senior Repository Maintainer

---

## 1. Executive Summary

The repository has been analyzed and reorganized to improve maintainability, modularity, and adherence to the established architecture rules. Key oversized modules in the agents layer have been split, root directory clutter has been eliminated, and documentation has been consolidated.

---

## 2. Updated Repository Structure

- `fastapi-agents/`: Python backend hosting stateless agents. 
    - **Refactored**: `memory_agent` and `reading_creator` are now modular packages.
- `fastapi-domain/`: Python backend providing the domain authority and business logic APIs (SSOT).
- `nextjs/`: Frontend and BFF layer.
- `supabase/`: Database migrations and configuration.
- `docs/`: Consolidated documentation and research notes.
- `scripts/`: Project-wide automation and startup scripts.
- `tools/`: Specialized Python scanners for quality guarding.

---

## 3. Improvements Implemented

### 3.1 Modularization of Agents
- **Memory Agent**: Split the 600+ line `memory_agent.py` into `app/agents/memory_agent/` containing:
    - `state.py`: TypedDict state definition.
    - `tools.py`: Tool implementations.
    - `nodes/implementation.py`: Individual LangGraph node logic.
    - `graph.py`: Graph composition logic.
- **Reading Creator**: Split `reading_creator.py` into `app/agents/reading_creator/` containing:
    - `types.py`, `prompts.py`, and `generator.py`.

### 3.2 Repository Hygiene
- **Root Cleanup**: Removed temporary scratchpad files (`runs.json`, `debug.txt`, `hardcoded.txt`, etc.).
- **Documentation Migration**: Moved root-level `.md` files (`RESEARCH.md`, `scenarios.md`, `usecase.md`) to the `docs/` directory.
- **Empty Directory Removal**: Removed unused `fastapi-agents/scripts/`.
- **Git Ignore Improvements**: Added `.log`, `.coverage`, and `htmlcov/` to `.gitignore`.

### 3.3 Verification of "Dead Code"
- **MCP Client**: Investigated `mcp_domain_client.py`. Confirmed it is actively used by agent tools to communicate with the Domain SSOT's tool interface.
- **Reading Endpoints**: Verified that while Next.js primarily uses Supabase triggers for async generation, the FastAPI endpoints still serve as the agent-hosting backend for these triggers.

### 3.4 Python 3.11 Standardization
- All backend projects have been standardized on Python 3.11, ensuring consistency across environments.

---

## 4. Pending / Future Observations
- **Redundant Clients**: `DomainClient` (REST) and `MCPDomainClient` (SSE) both target the Domain service. While justified by tool-calling vs proxying needs, they could eventually be consolidated.
- **Next.js Large Files**: `readingService.ts` remains a large file but is currently stable. Further modularization by domain sub-topics may be beneficial as it grows.

---

## 5. Conclusion
The repository is now in a much "hardened" state. Imports are cleaner, responsibilities are better grouped, and the architectural boundaries between agents and domain logic are well-enforced.
