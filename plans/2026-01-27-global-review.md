# Plan: Global Review & Sidebar Rebranding

## Objective
Implement a unified "Review" ecosystem and rebrand "Learn" to "Decks" to improve navigation and focus on SRS-driven learning.

## Target Areas
1. **Sidebar**: Rebrand "Learn" -> "Decks". Add "Review".
2. **Routing**: Rename `/learn` route to `/decks`. Create new `/review` route.
3. **Global Review**: Implement a dedicated review dashboard and a "Review All" session.

## Detailed Steps

### Phase 1: Navigation & Routing
1. **Rename Route**:
    - Rename directory `src/app/(main)/learn` to `src/app/(main)/decks`.
    - Update all imports and `Link` references from `/learn` to `/decks`.
2. **Update Sidebar**:
    - Change "Learn" label to "Decks".
    - Add "Review" item with `GraduationCap` icon (or `RotateCcw` / `PlayCircle`). Use `LayoutDashboard` for Review? Let's use `RotateCcw` or `Brain`.
    - Update icons to be more distinct.

### Phase 2: Review Dashboard (`/review`)
1. **Create `/review/page.tsx`**:
    - High-impact header: "Daily Reviews".
    - "Quick Review All" section: Massive Claymorphism card showing total due items.
    - "Review by Deck" section: List of decks with "Due" counts and "Start Review" buttons.
    - Stats overview: Retention, Stability (from MockDB).

### Phase 3: Global Review Session (`/review/all`)
1. **Create `/review/all/page.tsx`** (or dynamic route):
    - Fetches all due items using `MockDB.fetchDueItems(userId)`.
    - Reuses the session logic from the deck session page.

### Phase 4: Polish & Premium UI
1. **Claymorphism**: Apply consistent `rounded-clay` and `shadow-clay` to review cards.
2. **Animations**: Smooth transitions between the dashboard and the session.
3. **Visual Feedback**: Pulse effects on "Review All" if due items > 0.

## Skill Reference
- `ui-ux-pro-max`: For the premium dashboard design.
- `nextjs-best-practices`: For route management and segmenting.
- `typescript-expert`: For data fetching and SRS logic.

## Error Handling
- Empty state: Show "Nothing to review! Go learn some new cards." with a CTA to the Decks page.
- Loading state: Custom shimmer effects for the due counts.
