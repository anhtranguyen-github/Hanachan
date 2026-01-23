# Plan: Data Rendering Demo

## Objective
Create a showcase of how the raw data from `/data/` (Kanji, Vocab, Grammar) can be rendered using the established premium Claymorphism design system.

## Components to Create
1.  **`RichTextRenderer`**: A universal component to handle both HTML strings (Kanji) and Structured Tokens (Vocab).
2.  **`DataDemoPage`**: A dashboard to select between Kanji and Grammar demos.
3.  **`KanjiDetailDemo`**: Rendering "山" with mnemonics, readings, and radicals.
4.  **`GrammarDetailDemo`**: Rendering "Adjective + て + B" with its complex structure and usage notes.

## Implementation Details
- **Location**: `src/app/(demo)/data-render/` to keep it separate from the logic.
- **Data Fetching**: Use a server-side helper to read the JSON/JSONL files locally.
- **Styling**: Map Wanikani/Bunpro style classes to Hanachan's color tokens.

## Next Steps
1. Create `RichTextRenderer` component.
2. Create server-side data utility.
3. Build the demo pages.
