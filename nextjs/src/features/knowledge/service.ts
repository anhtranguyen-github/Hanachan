import { curriculumRepository } from "./db";
import { KnowledgeUnit, KnowledgeUnitType } from "./types";
import { uuidSchema } from "@/lib/validation";

export class KnowledgeService {
    async getById(id: string, type: KnowledgeUnitType): Promise<KnowledgeUnit | null> {
        // Only validate if it looks like a UUID, otherwise it's likely a slug
        if (id.includes('-')) uuidSchema.parse(id);
        return await curriculumRepository.getById(id, type);
    }

    async getBySlug(slug: string, type: KnowledgeUnitType): Promise<KnowledgeUnit | null> {
        return await curriculumRepository.getBySlug(slug, type);
    }

    async getByLevel(level: number, type: KnowledgeUnitType): Promise<KnowledgeUnit[]> {
        return await curriculumRepository.listByType(type, level);
    }

    async getAllByType(type: KnowledgeUnitType): Promise<KnowledgeUnit[]> {
        const result = await curriculumRepository.getAllByType(type);
        return result.data;
    }

    async getSentencesByKU(unitId: string): Promise<any[]> {
        uuidSchema.parse(unitId);
        return await curriculumRepository.getSentencesByKU(unitId);
    }

    async getLinkedKanjiByRadical(radicalSlug: string): Promise<any[]> {
        // This functionality is handled in getBySlug for radicals
        return [];
    }

    async getLinkedVocabByKanji(kanjiChar: string): Promise<any[]> {
        // This functionality is handled in getBySlug for kanji
        return [];
    }

    async search(query: string, type?: KnowledgeUnitType): Promise<KnowledgeUnit[]> {
        const result = await curriculumRepository.search(query, type);
        return result.data || [];
    }
}

export const knowledgeService = new KnowledgeService();
