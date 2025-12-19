import { kuRepository } from "./db";
import { KnowledgeUnit, KUType } from "./types";
import { uuidSchema } from "@/lib/validations";

export class KnowledgeService {
    async getById(id: string, type: KUType): Promise<KnowledgeUnit | null> {
        // Only validate if it looks like a UUID, otherwise it's likely a slug
        if (id.includes('-')) uuidSchema.parse(id);
        return await kuRepository.getById(id, type);
    }

    async getBySlug(slug: string, type: KUType): Promise<KnowledgeUnit | null> {
        return await kuRepository.getBySlug(slug, type);
    }

    async getByLevel(level: number, type: KUType): Promise<KnowledgeUnit[]> {
        return await kuRepository.getByLevel(level, type);
    }

    async getAllByType(type: KUType): Promise<KnowledgeUnit[]> {
        return await kuRepository.getAllByType(type);
    }

    async getSentencesByKU(kuId: string): Promise<any[]> {
        uuidSchema.parse(kuId);
        return await kuRepository.getSentencesByKU(kuId);
    }

    async getLinkedKanjiByRadical(radicalSlug: string): Promise<any[]> {
        return await kuRepository.getLinkedKanjiByRadical(radicalSlug);
    }

    async getLinkedVocabByKanji(kanjiChar: string): Promise<any[]> {
        return await kuRepository.getLinkedVocabByKanji(kanjiChar);
    }

    async search(query: string, type?: KUType): Promise<KnowledgeUnit[]> {
        return await kuRepository.search(query, type);
    }
}

export const knowledgeService = new KnowledgeService();
