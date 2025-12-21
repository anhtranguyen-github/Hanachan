# Architecture & Rules (Next.js App Router -- Practical)

> Mục tiêu: **Tách bạch UI -- Business Logic -- Infrastructure**, đủ
> chặt để phát triển dài hạn, **không textbook, không overengineering**.

------------------------------------------------------------------------

## 1. Tổng quan kiến trúc

Kiến trúc tuân theo tư duy:

> **Feature-oriented + Layered by responsibility**

-   **Next.js App Router** = *delivery layer*\
    (routing, layout, auth guard)
-   **Business logic** gom theo **feature**
-   **UI** chia thành:
    -   UI **dùng chung toàn app**
    -   UI **đặc thù cho từng feature**
-   **Infrastructure** được bọc qua adapter

------------------------------------------------------------------------

## 2. Cấu trúc thư mục chuẩn

    src/
    ├── app/
    ├── features/
    │   ├── sentence/
    │   │   ├── components/
    │   │   ├── service.ts      # Logic & API
    │   │   ├── db.ts           # Data access
    │   │   └── types.ts
    │   ├── learning/
    │   │   ├── components/
    │   │   ├── schedule.ts     # FSRS algorithm
    │   │   ├── service.ts
    │   │   ├── db.ts
    │   │   └── types.ts
    │   └── chat/
    ├── ui/
    │   ├── components/
    │   └── hooks/
    ├── services/
    ├── db/
    ├── lib/
    └── types/

------------------------------------------------------------------------

## 3. Trách nhiệm từng tầng

### 3.1 `app/` -- Delivery Layer

-   Routing, layout, auth guard
-   Không chứa business logic

------------------------------------------------------------------------

### 3.2 `features/` -- Business Layer

-   Logic nghiệp vụ theo feature
-   UI đặc thù nằm trong `features/*/components`

------------------------------------------------------------------------

### 3.3 `ui/` -- Global UI

-   Component dùng chung
-   Không biết domain

------------------------------------------------------------------------

## 4. Flow dữ liệu

    Feature UI
    → Server Action / API
    → feature.service
    → feature.repo / engine
    → services

------------------------------------------------------------------------

## 5. RULES

-   UI global không import feature
-   Feature logic không import UI
-   App router không chứa nghiệp vụ
-   Infrastructure chỉ đi qua repo

------------------------------------------------------------------------

## 6. Không làm

-   Không textbook DDD
-   Không overengineering

------------------------------------------------------------------------

------------------------------------------------------------------------

## 8. STRICT ARCHITECTURE RULES (NON-NEGOTIABLE)

### 8.1 Data Persistence
- There is exactly **ONE** Data Persistence layer per feature.
- This layer **MUST** be named `db.ts`. 
- `repository.ts` **MUST NEVER** be created or referenced.
- `db.ts` represents the **Repository Pattern** in Clean Architecture.

### 8.2 Access Control
- `db.ts` **MUST NOT** be imported or called directly from:
    - API routes
    - Controllers
    - Actions
    - Components
    - UI or framework layers
- Direct database access outside `db.ts` is **FORBIDDEN**.

### 8.3 Dependency Direction
- **Flow**: `API / App layer` → `Usecases / Services` → `db.ts`
- Reverse or skipping layers (e.g., API calling `db.ts` directly) is **NOT allowed**.

### 8.4 Responsibilities
- **`db.ts`**:
    - Contains **ONLY** persistence logic (queries, inserts, updates).
    - HAS **NO** business rules, no orchestration, no framework logic.
- **Usecases / Services**:
    - Contain **ALL** business rules.
    - Are the **ONLY** layer allowed to call `db.ts`.

### 8.5 Enforcement
- If data is needed, create or extend a usecase/service.
- Never import `db.ts` outside the business layer.
- Any violation is considered an architectural error.

------------------------------------------------------------------------

## 9. Câu chốt

> "Tổ chức code theo feature, tách rõ UI, business và infrastructure."
