
export interface SidebarMetadata {
    group?: string;
    status?: 'NEW' | 'VIEWED' | 'COMPLETED';
}

export type ArtifactType = 'FLASHCARD' | 'FLASHCARD_SINGLE' | 'FLASHCARD_DECK' | 'QUIZ' | 'EXAM' | 'NOTE' | 'MINDMAP' | 'VOCABULARY' | 'TASK' | 'SUMMARY' | 'AUDIO';

export interface Artifact {
    id: string; // Mongo ID
    type: ArtifactType;
    title: string;
    description?: string;
    data: any; // Flexible content
    metadata: SidebarMetadata & Record<string, any>;
    createdAt: string;
    conversationId?: string;
    messageId?: string;
    savedToLibrary?: boolean;
    actions?: any;
}

// Specific Data Structures (optional, for type guards)
export interface FlashcardDeckData {
    title: string;
    cards: Array<{ front: string; back: string; reading?: string; example?: string }>;
}

export interface QuizData {
    title: string;
    questions: Array<any>;
    quizType?: 'quiz' | 'exam';
}
