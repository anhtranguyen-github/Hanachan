# Combined Package & Structure Design

## Part 1: Package Architecture (Refined)
*(Source: packages.md)*

# Human-Design: Package Architecture (Refined)

This document describes the organization of the Hanachan codebase, following a **KU-centric (Knowledge Unit)** and **Sentence-centric** approach.

## 1. Modular Structure

The project is organized into business domains within `src/modules/`. Each module is a Bounded Context that communicates via a clear public API.

```text
src/
├── app/            # Delivery Layer: Routing, Pages, Layouts (Next.js)
├── features/       # Domain Features (Business Logic)
│   ├── auth        # Identity, Quotas & Access
│   ├── analytics   # Progress tracking & Statistics
│   ├── chat        # AI Tutor interaction logic
│   ├── decks       # Flashcard Decks Management
│   ├── knowledge   # Core Knowledge Base (The stable "Ground Truth")
│   ├── learning    # Progress tracking & SRS Engine
│   ├── sentence    # Sentence Analysis & Mining (Core Loop)
│   └── youtube     # Source provider: Subtitles & Immersion
├── services/       # External Adapters (OpenAI, YouTube API)
├── db/             # Persistence logic & Schema
└── ui/             # Shared UI components & Utils
```

## 2. Dependency Rules & Boundaries

1.  **CKB (The Stable Core)**: The Core Knowledge Base is the source of truth for all Radical, Kanji, Vocab, and Grammar. Other modules reference KU IDs from here.
2.  **Sentence-Centric Flow**: Every learning journey starts with a `Sentence`. The `analysis` module breaks down the sentence and links it to `ckb` units.
3.  **Learning State Isolation**: The `learning` module tracks the user's relationship with a KU (Spaced Repetition data) but does not store the linguistic data itself.
4.  **AI as a Service**: The `chatbot` and `analysis` modules use external AI services but are wrapped in adapters to remain flexible.

## 3. Module Internal Layout (Clean-lite)

We avoid over-engineering by using a "Clean-lite" structure inside modules:

```
features/[feature]/
├── components/     # UI Components (Feature-specific)
├── db.ts           # Database Access (Repository)
├── service.ts      # Business Logic & APIs
├── types.ts        # Type Definitions
└── index.ts        # Public exports (Clean API)
```

---

## Part 2: Detailed Project Structure & Boundaries
*(Source: Thiết kế gói (Package Design) và Cấ.txt)*

# Thiết kế gói (Package Design) và Cấu trúc Project (Tổng quan)

## 1. Mục tiêu và phạm vi

Phần này trình bày **tổng quan thiết kế gói và cấu trúc codebase** của hệ thống học tiếng Nhật, nhằm:

* Làm rõ cách tổ chức project ở mức **kiến trúc – module**
* Tránh over-engineering, không đi vào chi tiết triển khai
* Đủ thông tin để các agent hoặc lập trình viên khác **tự hiểu và triển khai tiếp**
* Phù hợp đưa trực tiếp vào khóa luận tốt nghiệp CNTT

Nội dung **không mô tả chi tiết lớp, hàm hay thuật toán**, mà tập trung vào ranh giới trách nhiệm giữa các module.

---

## 2. Nguyên tắc thiết kế tổng quát

Hệ thống được thiết kế theo các nguyên tắc sau:

1. **Modular Monolith**: một codebase thống nhất, chia theo module nghiệp vụ
2. **Tách theo miền nghiệp vụ (business domain)**, không theo CRUD hay công nghệ
3. **Core Knowledge Base (CKB)** là lõi tri thức dùng chung cho toàn hệ thống
4. **Sentence-centric & Grammar-Cloze**: Mọi luồng học bắt đầu từ một câu. Grammar BẮT BUỘC dùng Cloze format trên câu.
5. **CKB-centric & Character-Meaning**: Knowledge Units (KU) là nguồn tri thức. Vocab/Kanji/Radical dùng format Chữ-Nghĩa.
6. **KU-centric Persistence**: Trạng thái học tập gắn với Knowledge Unit, không gắn với Flashcard.
7. **Unified Status (FSRS)**: Dùng `new` | `learning` | `review` | `relearning` | `burned` (đồng bộ với design system).

---

## 3. Phân tầng kiến trúc ở mức khái quát

Ở mức khái quát, hệ thống gồm ba tầng chính:

* **Presentation Layer**: giao diện người dùng, routing (Next.js - `src/ui/`)
* **Application / Feature Layer**: các module nghiệp vụ chính (`src/features/`)
* **Infrastructure Layer**: cơ sở dữ liệu (`dbsu/`), dịch vụ bên ngoài, cấu hình

---

## 4. Cấu trúc thư mục codebase (tổng quan)

```text
src/
├── app/        # Giao diện, routing, page & layout (Next.js)
├── features/   # Các feature nghiệp vụ chính của hệ thống
├── services/   # Tích hợp dịch vụ bên ngoài (YouTube, LLM, ...)
├── db/         # Truy cập cơ sở dữ liệu, schema, migration
├── lib/        # Tiện ích và hạ tầng dùng chung
├── types/      # Kiểu dữ liệu dùng chung
└── config/     # Cấu hình hệ thống
```

---

## 5. Thiết kế module nghiệp vụ (mức khái quát)

Các module nghiệp vụ được đặt trong thư mục `src/features/`, mỗi module đại diện cho một miền chức năng rõ ràng.

```text
features/
├── auth        # Xác thực & Quota
├── analytics   # Thống kê & Dashboard
├── chat        # AI Tutor & Hội thoại
├── decks       # Quản lý Deck (System & User)
├── knowledge   # Core Knowledge Base (Radical/Kanji/Vocab/Grammar)
├── learning    # FSRS Algorithm & Learning State
├── sentence    # Phân tích câu & Mining
└── youtube     # Subtitles & Video Learning
```

---

## 6. Vai trò và ranh giới của các module

* **auth**: quản lý người dùng, không chứa logic học tập
* **knowledge**: nguồn tri thức chuẩn (CKB), các module khác chỉ tham chiếu
* **sentence**: quản lý câu học, không xử lý phân tích
* **analysis**: phân tích ngôn ngữ, ánh xạ về CKB và thẩm định/sửa lỗi câu theo yêu cầu
* **flashcard**: biểu diễn kiến thức dưới dạng có thể học
* **learning**: theo dõi trạng thái và tiến độ học cá nhân
* **content**: tổ chức flashcard thành bài học
* **youtube**: cung cấp câu từ nguồn video
* **chatbot**: hỗ trợ giải thích và dẫn dắt học tập
* **analytics**: tổng hợp chỉ số học tập (dữ liệu dẫn xuất)

Mỗi module có ranh giới trách nhiệm rõ ràng, hạn chế phụ thuộc chéo để giảm độ phức tạp toàn hệ thống.

---

## 7. Kết luận

Thiết kế gói và cấu trúc project được xây dựng ở mức khái quát, tập trung vào ranh giới nghiệp vụ thay vì chi tiết kỹ thuật. Cách tổ chức này giúp hệ thống tránh over-engineering, đồng thời đủ rõ ràng để các lập trình viên hoặc agent khác tiếp tục triển khai, mở rộng và tối ưu trong các giai đoạn phát triển tiếp theo.
