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

## 7. Naming Convention
- **File name mô tả việc nó làm, không mô tả tầng kiến trúc.**
- Trong feature folder, `types.ts`, `db.ts`, `service.ts` là đủ rõ, không cần prefix `feature.xxx.ts`.
- Ví dụ: `schedule.ts` (FSRS logic), `state.ts` (Learning state ops).

------------------------------------------------------------------------

## 8. Câu chốt

> "Tổ chức code theo feature, tách rõ UI, business và infrastructure."
