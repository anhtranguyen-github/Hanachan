# Batch Creation Logic Documentation

## 1. Overview
A "Batch" in Hanachan represents a discrete set of new learning items (Knowledge Units) that a user is exposed to in a single "Learn" session. Unlike infinite scrolling or continuous learning, the system enforces a "Batch" structure to ensure focused learning and cognitive load management.

**Default Batch Size:** 5 Items.

## 2. Trigger Mechanism
A new batch is created when:
*   A user clicks "Start Discovery" (or "Begin Session") on the Dashboard or Learn Overview page.
*   The system determines that there are unlearned items available for the user's current level.

## 3. Creation Algorithm
The batch creation logic is encapsulated in `src/features/learning/db.ts` -> `learningRepository.fetchNewItems`.

### 3.1 Constraints & Inputs
*   **User ID**: The learner requesting a session.
*   **Current Level**: The level context (usually the user's current unlock level, e.g., Level 5).
*   **Limit**: The maximum size of the batch (Default: 5).

### 3.2 Step-by-Step Selection Logic

1.  **Exclusion of Known Items (Anti-Join)**
    *   The system first queries the `user_learning_states` table to collect all `ku_id`s that the user has already interacted with (regardless of whether they are 'learning', 'review', or 'burned').
    *   *Goal:* Ensure the user is never taught an item they have already started.

2.  **Candidate Selection (Filtering)**
    *   The system queries the central `knowledge_units` table.
    *   **Filter 1:** Exclude all IDs from Step 1.
    *   **Filter 2:** `level == User's Current Level` (if level context is provided).

3.  **Prioritization (Sorting)**
    *   Candidates are sorted by:
        1.  **Level (Ascending):** Prioritize lower level items first (in case of mixed-level requests).
        2.  **Slug/ID (Ascending):** Deterministic ordering to ensure consistency.

4.  **Limiting**
    *   The top `N` items (where `N = Limit`) are selected.

5.  **Initialization**
    *   The selected Knowledge Units are mapped to an initial objects for the frontend controller:
        *   `state`: 'new'
        *   `srs_stage`: 0
        *   `next_review`: null

## 4. Source Code Reference

### Primary Backend Service
**File:** `src/features/learning/db.ts`
**Function:** `fetchNewItems`

```typescript
async fetchNewItems(userId: string, limit: number = 5, level?: number) {
    // 1. Get IDs of items already learned
    const { data: learned } = await supabase
        .from('user_learning_states')
        .select('ku_id')
        .eq('user_id', userId);
    
    // ...

    // 2. Query Knowledge Units excluding learned IDs
    let query = supabase.from('knowledge_units').select('...');
    
    // ... filtering and sorting ...
    
    return query.limit(limit);
}
```

### Frontend Orchestration
**File:** `src/app/(main)/learn/session/page.tsx`
**Component:** `SessionContent` -> `loadSession`

The frontend calls the service, receives the batch, and initializes the `ReviewSessionController`.

```typescript
const items = await fetchNewItems(user.id, `level-${currentLevel}`, 5);
// ...
const newController = new ReviewSessionController(user.id);
await newController.initSession(items);
```
