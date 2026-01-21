# Kiến Trúc Phần Mềm Hanachan V2

## 1. Lựa Chọn Kiến Trúc

### 1.1 Kiến Trúc Tổng Thể: Feature-First Architecture với Next.js 14 App Router

Hanachan V2 áp dụng kiến trúc **Feature-First Architecture** kết hợp với **Client-Server Architecture** dựa trên Next.js 14 App Router. Đây là một biến thể hiện đại của kiến trúc MVC, được điều chỉnh cho phù hợp với các ứng dụng web hiện đại.

**Lý do lựa chọn:**
- **Tính module hóa cao**: Tách biệt logic theo tính năng thay vì theo lớp
- **Khả năng mở rộng**: Dễ dàng thêm mới tính năng mà không ảnh hưởng đến các module khác
- **Performance optimization**: Tận dụng Next.js App Router với Server Components và Client Components
- **Development experience**: TypeScript và file-based routing giúp tổ chức code rõ ràng

### 1.2 Giải thích Sơ bộ về Kiến Trúc

**Feature-First Architecture** là cách tiếp cận tổ chức code theo các tính năng độc lập, mỗi tính năng chứa đầy đủ các thành phần cần thiết (UI, logic, state, types). Điều này khác với kiến trúc MVC truyền thống nơi các thành phần được tổ chức theo lớp (Model, View, Controller).

## 2. Kiến Trúc Cụ Thể cho Ứng Dụng Hanachan V2

### 2.1 Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (Next.js App Router + React)            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Pages/       │  │   Components    │  │   Layouts    │ │
│  │   (app/*.tsx)  │  │   (components/) │  │   (layout)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer (Features)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Auth Feature │  │  Learning       │  │  Decks       │ │
│  │   (features/   │  │  (features/     │  │  (features/  │ │
│  │   auth/)       │  │  learning/)     │  │  decks/)     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Services      │  │   Mock DB       │  │   Supabase   │ │
│  │   (lib/*.ts)    │  │   (lib/mock-db) │  │   (lib/supabase) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    SERVER SIDE                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   API Routes    │  │   Database       │                  │
│  │   (app/api/)    │  │   (Supabase)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Phân tích Chi tiết các Thành phần

#### 2.2.1 Presentation Layer (View trong MVC)

**Thành phần cụ thể:**
- **Pages**: `src/app/(main)/dashboard/page.tsx`, `src/app/(main)/decks/page.tsx`
- **Components**: `src/components/layout/Sidebar.tsx`, `src/components/shared/`
- **Layouts**: `src/app/layout.tsx`, `src/app/(main)/layout.tsx`

**Đặc điểm:**
- Sử dụng Next.js App Router với file-based routing
- Kết hợp Server Components và Client Components
- TailwindCSS cho styling với design system "Vibrant Sakura"
- TypeScript cho type safety

#### 2.2.2 Business Logic Layer (Controller trong MVC)

**Thành phần cụ thể:**
- **Auth Feature**: `src/features/auth/AuthContext.tsx` + `useUser` hook
- **Learning Feature**: `src/features/learning/service.ts` + algorithm FSRS
- **Decks Feature**: `src/features/decks/service.ts` + `DeckService` class
- **YouTube Feature**: `src/features/youtube/` (video processing)
- **Chat Feature**: `src/features/chat/` (AI integration)

**Đặc điểm:**
- Mỗi feature là một module độc lập
- Sử dụng React Context cho state management
- Service pattern cho business logic
- Hooks cho reusable logic

#### 2.2.3 Data Access Layer (Model trong MVC)

**Thành phần cụ thể:**
- **Services**: `src/lib/supabase.ts`, `src/lib/validation.ts`
- **Mock Database**: `src/lib/mock-db/` (types, store, seeds)
- **Data Readers**: `src/lib/data-reader.ts`, `src/lib/ku-parser.ts`

**Đặc điểm:**
- Abstraction layer cho data access
- Mock database cho development
- Supabase cho production database
- Zod cho data validation

### 2.3 Data Flow Architecture

```
User Interaction → Component → Hook/Service → Data Layer → Database
        ↑                ↓              ↓              ↓
   UI Update ← State Change ← Business Logic ← Data Response
```

**Ví dụ cụ thể - Learning Flow:**
1. User clicks "Review" button → `DashboardPage` component
2. Component calls `useUser()` hook → gets user context
3. Hook calls `fetchDueItems()` service → `MockDB.fetchDueItems()`
4. MockDB queries in-memory store → returns due items
5. Service returns data → hook updates state
6. Component re-renders with new data

### 2.4 State Management Architecture

**Multi-level State Management:**
- **Global State**: React Context (AuthContext)
- **Feature State**: Local component state + hooks
- **Server State**: MockDB/Supabase queries
- **Form State**: Controlled components với validation

### 2.5 API Architecture

**Hybrid API Approach:**
- **Internal APIs**: Service layer calls within the application
- **External APIs**: Supabase client, YouTube API, OpenAI API
- **Future REST APIs**: `src/app/api/` directory cho external integrations

## 3. Thay Đổi và Cải Tiến so với Kiến Trúc Lý Thuyết

### 3.1 So với MVC Truyền thống

**Khác biệt chính:**
- **Feature-first thay vì Layer-first**: Tổ chức theo tính năng thay vì theo lớp
- **Hybrid Rendering**: Kết hợp Server và Client components
- **Type-first Development**: TypeScript interfaces ở mọi layer
- **Modern Tooling**: Next.js 14, TailwindCSS, Zod validation

### 3.2 Cải tiến Đặc thù cho Hanachan

**1. Learning Algorithm Integration:**
- FSRS algorithm được tích hợp trực tiếp vào service layer
- State tracking cho spaced repetition system

**2. Multi-modal Content Support:**
- YouTube video processing pipeline
- Japanese text analysis với kuromoji
- Audio integration cho vocabulary

**3. Mock-First Development:**
- Complete mock database cho development
- Easy transition đến production database

**4. Component Composition:**
- Reusable UI components với consistent design system
- Layout components cho consistent navigation

### 3.3 Architecture Decisions và Rationale

**1. Next.js App Router:**
- **Benefit**: Automatic code splitting, SEO optimization
- **Trade-off**: Learning curve cho Server/Client components

**2. Feature-First Organization:**
- **Benefit**: Better scalability, easier onboarding
- **Trade-off**: Some code duplication between features

**3. Mock Database:**
- **Benefit**: Fast development, no external dependencies
- **Trade-off**: Need to maintain sync with real schema

**4. TypeScript Everywhere:**
- **Benefit**: Type safety, better developer experience
- **Trade-off**: Initial setup complexity

## 4. Kết Luận

Kiến trúc Hanachan V2 là một sự kết hợp thông minh giữa các pattern hiện đại và requirements đặc thù của ứng dụng học tiếng Nhật. Bằng cách áp dụng Feature-First Architecture với Next.js 14, ứng dụng đạt được:

- **Maintainability**: Code organization rõ ràng, dễ bảo trì
- **Scalability**: Dễ dàng mở rộng tính năng mới
- **Performance**: Tối ưu với Next.js rendering strategies
- **Developer Experience**: TypeScript và modern tooling

Kiến trúc này không chỉ giải quyết bài toán hiện tại mà còn tạo nền tảng vững chắc cho sự phát triển tương lai của ứng dụng.
