---
description: "Master Development Workflow - Feature Lifecycle from Plan to Commit (Vibrant Sakura Edition)"
---

# Master Development Workflow (Standard Pro)

This workflow ensures high-quality execution using the **Primary Workflow** principles: Planning, Implementation, Testing, Review, and Integration.

## 0. Critical Rules & Principles
**IMPORTANT**: Analyze the skills catalog and activate the skills that are needed for the task during the process.
**Principles**: **YAGNI** (You Aren't Gonna Need It) - **KISS** (Keep It Simple, Stupid) - **DRY** (Don't Repeat Yourself)

### General
- **File Naming**: Use `kebab-case` with meaningful names (descriptive of *purpose*, not just layer) so LLMs/Grep can understand functionality instantly.
- **File Size**: Keep individual files under **200 lines**. Split large files into focused components/modules.
- **Structure**:
  - Use composition over inheritance.
  - Extract utility functions.
  - Create dedicated service classes for business logic.
- **Tools**:
  - Use `docs-seeker` for checking documentation.
  - Use `ai-multimodal` and `imagemagick` for media tasks.
  - Use `sequential-thinking` and `debugging` for deep analysis.

### Code Quality
- **Standards**: Prioritize functionality and readability. No syntax errors; code must compile.
- **Error Handling**: Use `try-catch` blocks & cover security standards. Activate **`error-handling-patterns`** skill.
- **Review**: Use `code-reviewer` agent after *every* implementation.
- **Implementation**: **REAL CODE ONLY**. No placeholders, mocks, or simulations.

### Pre-commit/Push
- **Linting**: Run linting before commit.
- **Tests**: Run tests before push. **Zero-Failure Policy**: Do not ignore failed tests.
- **Security**: NEVER commit secrets (.env, keys, credentials).
- **Commits**: Clean, professional messages (Conventional Commits). No AI references.

---

// turbo-all

1. **Phase 1: Research & Discovery (Researcher Agents)**
   - **Crucial Step**: Read `docs/constitution/PROJECT_DNA.md` and `docs/constitution/architecture-nextjs-practical.md` to understand core rules and structure.
   - Activate skills: `orchestration-expert`, `supabase-best-practices`, `docs-seeker`.
   - **Parallel Research**: Conduct research on technical topics and existing logic.
   - Use `grep_search` and `find_by_name` to understand architectural impact.
   - Ensure token efficiency while maintaining high quality.

2. **Phase 2: Structured Planning (Planner Agent)**
   - Activate `planning` skill.
   - **Context Search**: Read `docs/design_logic/USE_CASE_DETAIL.md`, `docs/design_logic/PACKAGE_STRUCTURE.md`, and `docs/database_schema_final.md` to align with the master design and database constraints.
   - Create a detailed implementation plan in `./plans/yyyy-mm-dd-[feature-name].md`.
   - **Principles**: Validate against **YAGNI, KISS, DRY**.
   - Define: Objective, Scope, **Existing file modifications (No enhanced files)**, and **TODO tasks**.
   - **Constraint Audit**: Check plan against `MD/CONSTRAINTS.md`.

3. **Phase 3: Recursive Implementation**
   - **Strict Rule**: Keep files **UNDER 200 lines**.
   - **Architecture**: ❌ Do NOT create `domain/`, `logic/`, or `infrastructure/` sub-folders. Use plain modules.
   - **Testing Layout**: ❌ Do NOT put tests next to source files. Use a separate `tests/` or `__tests__` folder.
   - **Naming**: Use `kebab-case` for descriptive naming.
   - **Skill**: Activate **`error-handling-patterns`** for robust error logic.
   - **Implementation**: Follow the plan. **Implement real code** (no placeholders).
   - **Compile Check**: [IMPORTANT] After modifying any file, run `pnpm check` or compile script.
   - Use `prompt-engineering-patterns` for AI/Graph features if needed.

4. **Phase 4: Verification (Tester Agent)**
   - Delegate to tester agent to run comprehensive unit/integration tests.
   - **Zero-Failure**: Do not ignore failed tests. Fix them immediately.
   - **No Cheats**: No mocks, tricks, or temporary solutions just to pass the build.
   - Success Criteria: All tests pass 100% before moving to the next phase.

5. **Phase 5: Code Quality & Review (Code-Reviewer Agent)**
   - Activate `code-review` skill.
   - Perform a self-review or delegate to the code-reviewer agent.
   - Verify: Functionality, Readability, Security, and Error Handling.
   - Optimize for performance and maintainability.

6. **Phase 6: Integration & Documentation (Docs-Manager Agent)**
   - Ensure seamless integration and maintain backward compatibility.
   - Update `docs/development-roadmap.md` and `docs/project-changelog.md`.
   - **Pre-Commit Check**: Run linting/formatting.
   - Use `git-workflow-manager` to commit with conventional format (Clean messages, no secrets).

7. **Phase 7: Debugging (Debugger Agent - If needed)**
   - Activate `debugging` skill.
   - For bugs in server or CI/CD, delegate to debugger agent.
   - Analyze summary reports, implement fixes, and re-run Phase 4 (Testing).
