# ADR-0002: Implement Repository Pattern for Data Persistence

## Status

Accepted

## Context

The current implementation of data fetching and mutation is often mixed within React components or isolated "Mock Actions". This causes several issues:
1.  **Direct Dependency**: UI components depend directly on Supabase/Database schema.
2.  **Harder Testing**: Mocking Supabase in Vitest is more complex than mocking a simple interface.
3.  **Code Duplication**: Data fetching logic (like joining tables for Kanji) is repeated across pages.

## Decision Drivers

- **Separation of Concerns**: UI shouldn't know how data is stored.
- **Interchangeability**: Ability to swap Supabase with a local DB or Mock DB easily.
- **Testability**: Use of interfaces allows for easy mocking in unit tests.

## Decision

We will implement the **Repository Pattern**. Each core module will have its own repository interface and implementations.

### Example

```typescript
// Interface (Domain)
interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

// implementation (Infrastructure)
class SupabaseUserRepository implements IUserRepository {
  async findById(id: string) {
    const { data } = await supabase.from('users').select().eq('id', id).single();
    return data;
  }
}
```

## Consequences

### Positive
- Components become purely representational.
- Data fetching logic is centralized and reusable.
- Easy to implement a `MockRepository` for UI-only demos.

### Negative
- Extra layer of abstraction might seem like "more work" for simple queries.
- Need to define DTOs (Data Transfer Objects) mapping DB rows to Domain entities.
