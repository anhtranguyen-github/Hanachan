---
name: "project-dna"
description: "Core architecture principles and development rules for Hanachan V2."
status: "active"
---

# Hanachan V2 Project DNA

This skill defines the structural and behavioral rules for the Hanachan V2 project. It must be consulted for every code change.

## 1. Architectural Principles (Feature-Oriented)

- **Next.js App Router**: Acts only as the delivery layer. No business logic in routes.
- **Feature-Oriented Layering**:
  - `src/features/[feature_name]/`: Contains descriptive business logic files (e.g., `service.ts`, `db.ts`, `schedule.ts`) and feature-specific components (`components/`).
  - `src/ui/`: Contains global, shared UI components (pure presentation).
  - `src/services/`: Infrastructure adapters (Supabase, OpenAI, AI). No business logic here.
- **Layers Flow**: UI -> Hooks -> Server Actions/API -> Feature Service -> Feature Repo/Engine -> Services.

## 2. Development Rules

- **File Naming**: Use `kebab-case` for folders/files, but prefer simple descriptive names inside features (`db.ts`, `types.ts`) over architectural prefixes (`knowledge.repo.ts`). Name by **responsibility**, not layer.
- **File Management**: Keep files under 200 lines. Split logic into smaller, focused modules.
- **Pure Logic**: `*.engine.ts` should be pure, easily testable, and independent of Next.js or DB.
- **No Placeholders**: Do not use "mock" data or "todo" comments for core features. Implement real code.
- **Consistency**: Follow the established architectural patterns in `MD/architecture_and_rules.md`.

## 3. Tech Stack Specifics
- **Next.js 14+ / React 18+**
- **LangChain/LangGraph**: Logic stays in `features/` (server-side). Using **Zod** for "Structured Outputs" to enforce AI response consistency.
- **Styling**: Tailwind CSS + Radix UI components.
- **Testing**: Vitest (Unit/Integration), Playwright (E2E).
- **Package Manager**: PNPM.

## 4. Safety & Quality
- **Type Safety**: Prefer strict TypeScript types over `any`.
- **Error Handling**: Use try-catch blocks and provide meaningful error messages.
- **Performance**: Optimize server actions and minimize client-side bundle size.
