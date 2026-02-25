import { kuRepository } from "./db";
import { KnowledgeUnit, KUType } from "./types";
import { uuidSchema } from "@/lib/validation";

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
        return await kuRepository.listByType(type, level);
    }

    async getAllByType(type: KUType): Promise<KnowledgeUnit[]> {
        const result = await kuRepository.getAllByType(type);
        return result.data;
    }

    async getSentencesByKU(kuId: string): Promise<any[]> {
        uuidSchema.parse(kuId);
        return await kuRepository.getSentencesByKU(kuId);
    }

    async getLinkedKanjiByRadical(radicalSlug: string): Promise<any[]> {
        // This functionality is handled in getBySlug for radicals
        return [];
    }

    async getLinkedVocabByKanji(kanjiChar: string): Promise<any[]> {
        // This functionality is handled in getBySlug for kanji
        return [];
    }

    async search(query: string, type?: KUType): Promise<KnowledgeUnit[]> {
        const result = await kuRepository.search(query, type);
        return result.data || [];
    }
}

export const knowledgeService = new KnowledgeService();
