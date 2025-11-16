# Architecture & Rules (Next.js App Router – Practical)

> Mục tiêu: **Tách bạch UI – Business Logic – Infrastructure**, đủ chặt để phát triển dài hạn, **không textbook, không overengineering**.

---

## 1. Tổng quan kiến trúc

Kiến trúc tuân theo tư duy **Feature-oriented + Layered by responsibility**.

- **Next.js App Router** chỉ đóng vai trò *delivery layer* (routing, layout, auth guard).
- **Business logic** được gom theo từng feature, độc lập UI.
- **UI** thuần hiển thị, không chứa nghiệp vụ.
- **Infrastructure** (Supabase, AI, external APIs) được bọc qua adapter.

---

## 2. Cấu trúc thư mục chuẩn

```
src/
├── app/                    # Routing + entry points (Next.js)
│   ├── (public)/           # landing, marketing
│   ├── (auth)/             # login, signup
│   ├── (app)/              # authenticated app
│   └── api/                # thin route handlers
│
├── features/               # ⭐ Business features (Server Logic + Dedicated UI)
│   ├── sentence/
│   │   ├── components/     # UI specifically for this feature
│   │   ├── sentence.service.ts
│   │   └── ...
│   ├── knowledge/
│   ├── learning/
│   ├── youtube/
│   └── chat/               # LangChain/AI specialized feature
│
├── ui/                     # 🔵 Global/Shared Client UI only (Buttons, Layouts, Modals)
│   ├── components/
│   └── hooks/
│
├── services/               # 🟡 External adapters (Supabase, AI, APIs)
├── db/                     # Schema, migrations
├── lib/                    # Utils, constants
└── types/                  # Shared types
```

---

## 3. Trách nhiệm từng tầng

### 3.1 `app/` – Delivery Layer

**Được phép:**
- Routing, layout, auth guard
- Gọi service từ `features`

**Không được phép:**
- Chứa business rule
- Truy cập DB trực tiếp
- Gọi Supabase / AI trực tiếp

---

### 3.2 `features/` – Business Layer (Server-only)

Mỗi feature đại diện cho **một nghiệp vụ chính của hệ thống**.

Ví dụ `features/learning/`:

```
learning/
├── srs.engine.ts        # Logic thuần (FSRS)
├── learning.service.ts  # Orchestrate use cases
├── learning.repo.ts     # Data access
└── learning.types.ts
```

- `*.engine.ts`: logic thuần, test dễ
- `*.service.ts`: xử lý use case
- `*.repo.ts`: giao tiếp DB / adapter

📌 **Bắt buộc**:
- `import "server-only"` cho các file logic (service, repo, engine).
- Các file trong `components/` của feature có thể là Client Component nếu cần tương tác, nhưng logic nghiệp vụ vẫn phải gọi qua Server Actions hoặc API.

### 3.2.1 LangChain & AI Rule
- **LangChain/LangGraph** logic chỉ nằm trong `features/` (server-side).
- `services/ai.ts` chỉ chứa config adapter thấp nhất.
- Prompt, Chains, và Graph logic nằm trong `*.service.ts` hoặc một file `*.graph.ts` riêng biệt trong feature tương ứng (như `chat` hoặc `analysis`).

---

### 3.3 `ui/` – Presentation Layer

**Chỉ chứa:**
- React components
- Hooks gọi API / server actions

**Không được phép:**
- Import `features/*`
- Import `services/*`
- Chứa business rule

UI **không biết**:
- FSRS là gì
- KU là gì
- DB lưu thế nào

---

### 3.4 `services/` – Infrastructure Adapters

- Supabase client
- OpenAI / Langchain
- External APIs

👉 Không chứa nghiệp vụ
👉 Có thể thay thế mà không ảnh hưởng feature

---

## 4. Flow dữ liệu chuẩn

```
UI Component
   ↓
ui/hooks (fetch / mutation)
   ↓
app/api or server action
   ↓
feature.service
   ↓
feature.repo / engine
   ↓
services (supabase / AI)
```

---

## 5. RULES – Quy tắc bắt buộc

### Rule 1: UI không import Business
❌ `ui/* → features/*`

---

### Rule 2: Business không biết UI
❌ `features/* → ui/*`

---

### Rule 3: App Router không chứa logic
❌ FSRS / analysis trong `page.tsx`

---

### Rule 4: Infrastructure chỉ đi qua repo
❌ Component gọi Supabase
❌ Service gọi OpenAI trực tiếp

---

### Rule 5: Logic thuần phải test được
- Engine không import Next.js
- Engine không import Supabase

---

## 6. Những thứ cố tình KHÔNG làm

- Không `controllers/`, `usecases/`, `entities/`
- Không DDD thuần giáo trình
- Không tách FE/BE thành 2 repo

👉 Tối ưu cho **đồ án sinh viên + sản phẩm thật**

---

## 7. Khi nào cần phức tạp hơn?

Chỉ khi:
- Team ≥ 5 người
- Hệ thống sống > 2 năm
- Có yêu cầu enterprise

👉 Hiện tại: **KHÔNG CẦN**

---

## 8. Câu chốt kiến trúc (dùng khi bảo vệ)

> "Em tổ chức code theo từng feature nghiệp vụ, tách rõ UI, business logic và infrastructure. Next.js App Router chỉ đóng vai trò delivery layer, còn toàn bộ logic nằm ngoài routing."

---

**Status**: ✅ Đủ chặt – ✅ Dễ phát triển – ✅ Không textbook

