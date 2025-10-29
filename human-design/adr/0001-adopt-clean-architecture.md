# ADR-0001: Adopt Clean Architecture and Feature-Based Modularization

## Status

Accepted

## Context

The current project `hanachan_v2_final` is a sophisticated Japanese learning platform that integrates AI, SRS (Spaced Repetition System), and YouTube immersion. However, the codebase has grown organically, leading to:

- Tight coupling between UI and business logic.
- Mixing of mock data with production components.
- Lack of a clear separation between domain rules (SRS, Japanese linguistics) and implementation details (Supabase, OpenAI).
- Difficulties in testing business logic independently of the framework.

To ensure this project meets the standards of an "Excellent Student Project" (đồ án sinh viên xuất sắc), it needs a robust, maintainable, and scalable architecture.

## Decision Drivers

- **Maintainability**: Easy to locate and fix bugs in complex logic (like SRS calculation).
- **Testability**: Must be able to unit test domain logic without database or API dependencies.
- **Scalability**: Ability to add new features (e.g., new AI analyzers) without refactoring the whole system.
- **Documentation**: Clear structure that serves as a guide for other developers/agents.

## Decision

We will adopt a hybrid of **Clean Architecture** and **Feature-Based Modularization**.

### Proposed Folder Structure

```
src/
├── app/              # Next.js App Router (Delivery Layer)
├── modules/          # Feature-based Bounded Contexts
│   ├── [feature]/
│   │   ├── components/    # Interface Adapters (UI)
│   │   ├── use-cases/     # Application Business Rules
│   │   ├── domain/        # Entities & Domain Services
│   │   ├── infrastructure/# Implementations (Supabase, LLM)
│   │   └── index.ts       # Public API for the module
├── lib/              # Shared Utilities & Internal Libraries
├── types/            # Global Shared Types
└── db/               # Global Database Configuration/Schema
```

## Consequences

### Positive
- **Clear Separation of Concerns**: Logic is separated from UI.
- **Improved Testability**: Use cases can be tested in isolation.
- **Framework Agnostic Core**: The core Japanese learning logic doesn't depend on Next.js or Supabase.
- **High Standards**: Demonstrates professional software engineering principles suitable for a top-tier student project.

### Negative
- **Initial Overhead**: Requires moving files and refactoring existing code.
- **Boilerplate**: More files and folders compared to a flat structure.

### Risks
- Over-engineering for very simple features.
- Mitigation: Keep simple CRUD features lightweight while applying full patterns to complex logic (SRS, AI Analysis).
