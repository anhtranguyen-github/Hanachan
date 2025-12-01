
import { kuRepository } from "./db";
import { KnowledgeUnit, KUType } from "./types";

export class KnowledgeService {
    async getById(id: string, type: KUType): Promise<KnowledgeUnit | null> {
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
