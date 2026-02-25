import { z } from 'zod';
import { SentenceEntitySchema } from '@/lib/validation';

export type SentenceEntity = z.infer<typeof SentenceEntitySchema>;

export interface KUToSentenceEntity {
    ku_id: string;
    sentence_id: string;
    is_primary: boolean;
    cloze_positions?: any;
}
