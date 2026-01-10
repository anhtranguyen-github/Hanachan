/**
 * AI Module Types
 * TypeScript types for LLM operations and chat functionality.
 */

// --- LLM Types ---

export interface LLMRequest {
    userId: string;
    task: string;
    input: {
        system?: string;
        prompt?: string;
        messages?: Array<{ role: string; content: string }>;
        userContext?: {
            userId: string;
        };
    };
}

export interface LLMResponse {
    content: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    cost: number;
}

// --- Chat Types ---

export enum ToolName {
    SEARCH_DICTIONARY = 'search_dictionary',
    ANALYZE_SENTENCE = 'analyze_sentence',
    MATCH_GRAMMAR = 'match_grammar',
    CREATE_DECK = 'create_deck',
    GET_READINESS = 'get_readiness',
    GENERATE_QUIZ = 'generate_quiz',
    EXTRACT_YOUTUBE_VOCABULARY = 'extract_youtube_vocabulary',
}

export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatContext {
    currentPage?: string;
    sessionHistory?: ChatTurn[];
}

export interface ChatMessageRequest {
    message: string;
    context?: ChatContext;
    confirmDeckCreation?: boolean;
}

export interface ToolCallResult {
    tool: ToolName;
    input: Record<string, unknown>;
    output?: unknown;
    error?: string;
}

export interface DeckCreationRequest {
    name: string;
    description?: string;
    items: Array<{ contentId: string; contentType: string }>;
    pendingConfirmation: boolean;
}

export interface ChatResponse {
    reply: string;
    toolCalls?: ToolCallResult[];
    suggestions?: string[];
    pendingDeck?: DeckCreationRequest;
}

// --- Quiz Types ---

export interface QuizItem {
    type: string;
    character?: string;
    slug?: string;
    meaning: string;
    reading?: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    itemRef: string;
}

export interface QuizGenerateRequest {
    items: QuizItem[];
    userId?: string;
}

export interface QuizResponse {
    questions: QuizQuestion[];
}

// --- Analyzer Types ---

export interface TokenDictionaryInfo {
    meanings: string[];
    source: string;
}

export interface TokenResult {
    surface: string;
    lemma?: string;
    reading: string;
    pos: string;
    conjugation?: string[];
    dictionary?: TokenDictionaryInfo | null;
}

export interface GrammarMatch {
    id: string;
    title: string;
    jlpt?: string;
    matched_surface: string;
    confidence: number;
}

export interface AnalysisMeta {
    dictionary_hits: number;
    grammar_hits: number;
}

export interface AnalyzerOptions {
    includeDictionary?: boolean;
    includeGrammar?: boolean;
    explain?: boolean;
}

export interface AnalyzerRequest {
    sentence: string;
    options?: AnalyzerOptions;
}

export interface AnalyzerResponse {
    sentence: string;
    tokens: TokenResult[];
    grammar: GrammarMatch[];
    meta: AnalysisMeta;
    explanation?: string;
}

// --- Dictionary Types ---

export interface DictionaryEntry {
    expression: string;
    reading: string;
    meanings: string[];
    source: string;
    type?: string;
}

export interface DictionarySearchResponse {
    query: string;
    count: number;
    results: DictionaryEntry[];
}

// --- Conversation Types ---

export interface Conversation {
    id: string;
    userId: string;
    title: string;
    messages: ChatTurn[];
    createdAt: string;
    updatedAt: string;
}
