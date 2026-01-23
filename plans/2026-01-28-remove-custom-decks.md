# Plan: Remove Custom Decks → Fixed 60 System Decks

**Date**: 2026-01-28
**Objective**: Remove the ability for users to create custom decks. All users now use the same fixed 60 system decks (Level 1 through Level 60, JLPT-style).

---

## 1. High-Level "WOW" Goal

- **Simplification**: Remove all custom deck CRUD operations (create, delete)
- **Consistency**: All users study from the same 60 official curriculum decks
- **Cleaner UX**: Remove "Create Deck" button and "Your Collections" section from UI

---

## 2. Domain & Invariants

### Rules That MUST Hold:
1. Only `deck_type = 'system'` decks exist and are shown
2. Users CANNOT create new decks
3. Users CANNOT delete system decks
4. `deck_items` are managed by the system, not users (pre-seeded per level)
5. 60 decks total (Level 1-60), each containing KUs of that level

### What We Keep:
- `getUserDecks` → returns only system decks
- `getDeckById`, `getDeckContent`, `getDeckMastery` → unchanged logic
- Study session flow → unchanged

### What We Remove:
- `createDeck`, `createMinedDeck`, `deleteDeck` functions
- `createDeckAction`, `deleteDeckAction` server actions
- UI elements: "Create Deck" button, modal, "Your Collections" section
- `addKUToDeck`, `addClozeToDeck` actions (users can't modify system decks)

---

## 3. Error Handling Strategy

- If somehow a non-system deck exists, filter it out silently
- 404 page if deck doesn't exist
- Loading states remain unchanged

---

## 4. Files to Modify

### 4.1 `src/features/decks/types.ts`
- Remove `CreateDeckInput` interface (optional, can keep for admin use)
- Simplify `DeckType` to only `'system'`

### 4.2 `src/features/decks/db.ts`
- Remove `createDeck` function
- Remove `deleteDeck` function
- Remove `addItemsToDeck` function (system decks are pre-seeded)
- Remove `removeItemFromDeck` function
- Simplify `getUserDecks` to only return system decks

### 4.3 `src/features/decks/service.ts`
- Remove `createDeck`, `createMinedDeck`, `deleteDeck`
- Remove `addKUToDeck`, `addClozeToDeck`, `removeFromDeck`

### 4.4 `src/features/decks/actions.ts`
- Remove `createDeckAction`, `deleteDeckAction`
- Remove `addKUToDeckAction`, `addClozeToDeckAction`

### 4.5 `src/app/(main)/decks/page.tsx`
- Remove "Create Deck" button
- Remove create deck modal
- Remove "Your Collections" section
- Only show "Official Curriculum" with 60 decks

---

## 5. Implementation Order

1. **Domain Layer** (`types.ts`) - Simplify types
2. **Database Layer** (`db.ts`) - Remove CRUD functions
3. **Service Layer** (`service.ts`) - Remove service methods
4. **Actions Layer** (`actions.ts`) - Remove server actions
5. **UI Layer** (`decks/page.tsx`) - Simplify UI
6. **Verification** - Test that decks page loads correctly

---

## 6. Premium UI Specs

- Keep existing brutalist/editorial design
- 60 deck cards arranged in a clean grid
- Group by JLPT level if possible (N5: 1-10, N4: 11-20, etc.)
- Clear progress indicators per deck

---

## 7. Skill Reference

- `nextjs-best-practices`: Server components where possible
- `typescript-expert`: Strict typing for remaining deck operations
- `production-code-audit`: Remove all dead code paths
