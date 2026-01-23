# Plan: Grammar Enrichment Migration

## Objective
Implement an "Enrichment Engine" that takes the raw `grammar.json` and bridges the gap to the `schema.sql` by adding structural relationships and metadata.

## Phase 2: Schema Finalization
1. **Extend `grammar_relations` enum**: Ensure DB supports `Synonym`, `Similar`, `Contrast`, `Antonym`, and `Prerequisite`.
2. **Metadata Sanitization**: Script to clean the `about` HTML text into a more readable format for the `RichTextRenderer`.

## Phase 3: The Enrichment Script (`scripts/enrich_grammar.ts`)
1. **Dependency Analysis**: 
    - Parse the `about` field in `grammar.json`.
    - Detect `@grammar[slug]` mentions in descriptions to automatically build the `grammar_prerequisites` table.
2. **Relationship Categorization**:
    - Iterate through the `related` property.
    - If `comparison_text` contains keywords like "instead of" or "unlike", flag as `Contrast`.
    - If `comparison_text` contains keywords like "similar" or "overlap", flag as `Similar`.
3. **Morpheme Linkage**:
    - Extract unique characters from all `examples`.
    - Check if those characters exist in `kanji.jsonl`.
    - Create a relational link so the UI can show "Kanji used in this Grammar".

## Execution Steps
1. Create a placeholder `enrich_grammar.ts` using Bun.
2. Test on a small subset (N5 grammar).
3. Generate a SQL migration file for the local Supabase.
