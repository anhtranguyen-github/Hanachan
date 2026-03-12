# Why fastapi-core is the SSOT (Single Source of Truth)

The introduction of `fastapi-core` establishes a clear architectural boundary between **Application Flows** and **Business Rules**.

### 1. Centralized Business Rules (The Law)
Previously, business logic (like how a reading score is calculated or who can submit an answer) was scattered across the Next.js frontend and FastAPI agent tools. If the rules changed, they had to be updated in multiple places.
In `fastapi-core`, the logic lives strictly in `app/core/`. No other service is allowed to implement these rules.

### 2. Guarded Data Mutation
By making `fastapi-core` the **only** service allowed to mutate Supabase data for business operations, we eliminate the risk of "dirty writes" from agents or frontend code that might bypass invariants. Agents are now stateless "thinkers" that must ask the Core Service to "do" things.

### 3. Identity and Permission Authorization
By deriving `user_id` strictly from the Supabase JWT (`app/auth/jwt.py`), the core service ensures that no client (nextjs or agent) can spoof user identities. Permissions are checked at the `ReadingPolicy` level before any action is taken.

### 4. Port & Adapter Independence
The service uses the **Hexagonal Architecture** (Ports and Adapters) pattern. This means the core business logic (`ReadingService`) knows nothing about Supabase or FastAPI. It only knows its "Ports" (`IReadingRepository`). This makes the system extremely testable and resilient to infrastructure changes.

### 5. Enforced RLS
The Supabase adapter uses the standard client which respects the user's JWT permissions, ensuring that we never bypass Row Level Security even within the backend service.
