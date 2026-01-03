
export class SentenceService {
    async analyze(text: string) {
        return {
            units: [],
            raw_text: text,
            coverage_stats: { total_units: 0, known_units: 0, percentage: 0 },
            existing_grammar_slugs: []
        };
    }
    async mine() { return null; }
}
export const sentenceService = new SentenceService();
