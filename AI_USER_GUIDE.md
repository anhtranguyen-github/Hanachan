# Hanachan V2: Comprehensive Project Handover & Guide

This document is the "Black Box" of the project. It ensures that any new AI agent or developer can pick up exactly where we left off without losing the project's soul (Vibrant Sakura) or architectural integrity.

---

## 🚀 How to Resume (For AI)
**MANDATORY**: At the start of every new session, the AI must:
1. Read `MD/CONSTRAINTS.md` (Design & Architecture Rules).
2. Read `docs/development-roadmap.md` (Current Progress).
3. Read `dbsu/schema/master_init.sql` (Database Truth).
4. Check `AI_USER_GUIDE.md` (this file).

---

## 🛠 Workflows: The Command Center
We use **Custom Workflows** to automate complex tasks. Always prefer these over manual commands.

### 1. `/dev-pro` (The Master Workflow)
- **Use for**: Building any NEW feature or a significant UI change.
- **What it does**: 
  - Research DB & Codebase.
  - Generates a plan in `plans/`.
  - Implements code following **Vibrant Sakura** rules.
  - Auto-tests & Auto-commits.
- **Example Usage**: `User: /dev-pro design the vocabulary list page`

---

## 📁 Folder Structure & Purpose

| Folder | Purpose | Key Rule |
| :--- | :--- | :--- |
| `src/features/` | Modular Monolith - Business logic. | Separation of concerns (Domain vs Infrastructure). |
| `src/ui/` | Shared React components. | No business logic here. |
| `dbsu/` | **Database Source of Truth**. | Contains SQL schemas and Seeder scripts. |
| `MD/` | Project "Constitution". | `CONSTRAINTS.md` is the highest authority. |
| `docs/` | Roadmaps and High-level docs. | `development-roadmap.md` tracks milestones. |
| `.agents/` | **AI Brain**. | Contains Skills and Workflows like `dev-pro`. |
| `plans/` | Feature blueprints. | Created before any major coding starts. |

---

## 🎨 Visual DNA: Vibrant Sakura (V5)
If the UI looks pale or blurry, **you have failed**.
- **Solid Backgrounds**: Pastel Pink/Slate bases only.
- **Vibrant Borders**: MANDATORY 2px borders using the category's `deepColor`.
- **NO Glassmorphism**: `backdrop-blur` is forbidden for main UI (cards, sidebars).
- **Lowercase Enums**: Everything in DB ('new', 'learning') must be lowercase in code.

---

## 📡 Database & Data (Seeding Status)
- **Supabase**: Primary database. RLS is enabled.
- **Seeding**: We are currently seeding 8000+ vocabulary items and 900+ grammar points with their respective **Sentence-Cloze** links.
- **Verification**: Use `npx tsx dbsu/scripts/verify-supabase.ts` to check data health.

---

## 📝 How to Git Commit
To keep the history clean for graduation/production:
- **Small changes**: "Git commit: [description]"
- **Feature work**: Let the `/dev-pro` workflow handle it.

**Handover Note**: Last session finished by synchronizing all enums to lowercase and establishing the Master Roadmap. Seeder is running. Next step is Phase 1 Milestones (Knowledge Browser).
