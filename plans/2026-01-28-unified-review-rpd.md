# Implementation Plan: Unified Review RPD

**Date**: 2026-01-28  
**Objective**: Implement strict Review Product Definition with unified FSRS states and type-specific prompts

---

## 1. Executive Summary

This plan implements the RPD specification that defines:
- **4 canonical learning unit types**: Radical, Kanji, Vocabulary, Grammar
- **ONE FSRS state per unit** (regardless of prompt variants)
- **Sentences are NOT learning units** - they are containers for grammar cloze
- **Type-specific review behaviors** with prompt variants

---

## 2. Current State Analysis

### ✅ Already Correct:
- 4 unit types defined: `'radical' | 'kanji' | 'vocabulary' | 'grammar'`
- `user_learning_states` table tracks ONE state per KU
- Grammar uses cloze deletion
- Mixed review queue sorted by `next_review`

### ❌ Needs Fixing:
1. **Kanji/Vocab prompt variants** - Currently show both meaning AND reading together
   - RPD requires: Either meaning OR reading prompt (random selection)
2. **Radical is correct** - Shows symbol, asks for meaning ✅
3. **Grammar is correct** - Uses cloze deletion ✅
4. **Prompt Type Tracking** - Need to track which prompt type was used (for grading context)

---

## 3. Domain Invariants (MUST HOLD)

| Rule | Description |
|------|-------------|
| **1.** | Each KU has exactly ONE `user_learning_states` row per user |
| **2.** | FSRS sees only: `again`, `hard`, `good`, `easy` - nothing else |
| **3.** | Prompt difficulty does NOT affect scheduling logic |
| **4.** | Review queue is sorted by `next_review ASC`, NOT by type |
| **5.** | Sentences are containers, NOT tracked in FSRS |

---

## 4. Implementation Details

### 4.1 Prompt Variants Per Type

| Type | Prompt Variants | Field to Show | Field to Ask |
|------|-----------------|---------------|--------------|
| **Radical** | `meaning_only` | Character/Symbol | Meaning |
| **Kanji** | `meaning`, `reading` | Character | Meaning OR Reading |
| **Vocab** | `meaning`, `reading` | Word (Japanese) | Meaning OR Reading |
| **Grammar** | `cloze_only` | Sentence with blank | Fill in grammar |

### 4.2 Type Changes

```typescript
// NEW: Prompt variant type
export type PromptVariant = 
    | 'meaning'      // Ask for meaning
    | 'reading'      // Ask for reading  
    | 'cloze';       // Grammar cloze

// UPDATED: BaseReviewCard
export interface BaseReviewCard {
    id: string;
    ku_id: string;
    ku_type: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
    level: number;
    character?: string;
    meaning: string;
    prompt_variant: PromptVariant;  // NEW: Which variant is this?
}
```

### 4.3 Card Generation Logic (Pseudo)

```typescript
switch (ku.type) {
    case 'radical':
        // Always meaning prompt
        return { ...card, prompt_variant: 'meaning' };
    
    case 'kanji':
    case 'vocabulary':
        // Random: meaning OR reading
        const variant = Math.random() > 0.5 ? 'meaning' : 'reading';
        return { ...card, prompt_variant: variant };
    
    case 'grammar':
        // Always cloze
        return { ...clozeCard, prompt_variant: 'cloze' };
}
```

### 4.4 UI Changes Per Prompt Variant

#### Kanji/Vocab - Meaning Prompt:
```
Front: 食 (show character)
       "What does this mean?"
Back:  "To eat / Food"  (show meaning only)
```

#### Kanji/Vocab - Reading Prompt:
```
Front: 食 (show character)
       "How do you read this?"
       Optional context: 「食べる」
Back:  たべる / ショク (show readings)
```

---

## 5. Files to Modify

### Domain Layer:
- `src/features/learning/types/review-cards.ts` - Add `prompt_variant`
- `src/features/learning/domain/review-card-generator.ts` - Implement variant selection

### UI Layer:
- `src/features/learning/components/ReviewCardDisplay.tsx` - Split Kanji/Vocab into variant-aware UI

### Service Layer:
- `src/features/learning/domain/review-session.ts` - No changes needed (grading is correct)

---

## 6. Implementation Order

1. **Types** - Add `PromptVariant` type
2. **Generator** - Implement random variant selection for Kanji/Vocab
3. **UI** - Create variant-aware card displays
4. **Verification** - Test all 4 unit types

---

## 7. Grading Rules (Per RPD)

| Prompt Type | Correct Criteria |
|-------------|------------------|
| Meaning | Exact or synonymous meaning |
| Reading | Context-appropriate reading |
| Cloze | Accept equivalent valid forms |

**Grading Maps to FSRS:**
- Wrong → `again`
- Almost/Partial → `hard`  
- Correct → `good`
- Perfect/Fast → `easy`

---

## 8. Test Cases

1. **Radical** - Shows symbol, asks meaning only
2. **Kanji Meaning** - Shows 食, asks "What does this mean?"
3. **Kanji Reading** - Shows 食, asks "How do you read this?"
4. **Vocab Meaning** - Shows 環境, asks meaning
5. **Vocab Reading** - Shows 環境, asks reading
6. **Grammar** - Shows cloze sentence, user fills blank

---

## 9. Success Criteria

- [ ] All review cards have `prompt_variant` field
- [ ] Kanji/Vocab randomly select between meaning and reading prompts
- [ ] UI displays appropriate question based on variant
- [ ] FSRS state remains ONE per KU (no fragmentation)
- [ ] Mixed queue works (sorted by next_due, not by type)
