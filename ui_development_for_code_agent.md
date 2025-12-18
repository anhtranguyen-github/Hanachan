# UI Development Process – For Code Agent

> **Goal**: Build reusable, stable, data-driven UI components that are easy to maintain and extend.

---

## Phase 1 – Define Style & Design Tokens

### 1. Base Style Definition

Define global design tokens. **No hard-coded values** inside components.

- **Colors**
  - primary
  - secondary
  - danger
  - text
  - background
  - border

- **Typography**
  - font family
  - font size scale (xs → xl)
  - font weight scale

- **Spacing**
  - spacing scale (4 / 8 / 16 / 24 / 32)

**Output**:
- `design-tokens.(ts|json|css)`
- All UI components consume tokens only

---

## Phase 2 – Build Standard Components

### 2.1 Core UI Components

Implement reusable base components:

- Button
  - variants: `primary | secondary | danger`
- Input
- Select
- Modal
- Card

### 2.2 Mandatory Component States

Every component **MUST** support:

- `hover`
- `disabled`
- `loading`
- `error`

**Output**:
- Reusable components
- Consistent appearance & behavior across the app

---

## Phase 3 – Pixel & Responsive Rules

### 3. Layout & Pixel Rules

- Use spacing & typography tokens only
- No magic numbers
- Consistent padding & margin

### 4. Responsive Behavior

- Desktop-first layout
- Tablet / Mobile adjustments:
  - flexible width
  - stacked layout when needed

**Output**:
- Stable layout on all screen sizes

---

## Phase 4 – Component Architecture Rules

### 5. Component Principles

- **1 component = 1 responsibility**
- UI components:
  - MUST NOT contain business logic
  - MUST NOT call APIs directly
- All data flows through props

### 6. Props Rules

- Explicit props only
- Clear naming
- No hidden side effects

**Output**:
- Predictable and reusable components

---

## Phase 5 – Data & State Integration

### 7. Data Connection

- API calls live outside UI components
- UI components receive:
  - `data`
  - `loading`
  - `error`

### 8. State Management

- **Local state**:
  - input values
  - modal open / close

- **Global state** (only if necessary):
  - user
  - session
  - shared app state
  - Tools: Zustand / Redux / Jotai

### 9. Required Data States

Every data-driven screen MUST handle:

- `loading`
- `empty`
- `error`

**Output**:
- UI reacts correctly to data changes

---

## Phase 6 – UX Polish (Required)

### 10. Empty State

- Show helpful guidance
- Suggest next user action

### 11. Error Handling

- Human-readable error messages
- Do not expose raw API errors

### 12. Motion & Feedback

- Loading skeletons
- Subtle transitions (hover, open/close)

**Output**:
- App feels smooth and responsive

---

## Final Acceptance Checklist

UI is accepted ONLY IF:

- Components are reusable
- No business logic inside UI components
- All states are handled
- Layout is stable & responsive
- UX feedback is clear and human-friendly

---

> This document is intended for **AI code agents** and **frontend implementation automation**.

