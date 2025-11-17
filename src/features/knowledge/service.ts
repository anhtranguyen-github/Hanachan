
import { kuRepository } from "./db";
import { KnowledgeUnit, KUType } from "./types";

export class KnowledgeService {
    async getById(id: string, type: KUType): Promise<KnowledgeUnit | null> {
        return await kuRepository.getById(id, type);
    }

    async getByLevel(level: number, type: KUType): Promise<KnowledgeUnit[]> {
        return await kuRepository.getByLevel(level, type);
    }

    async search(query: string, type?: KUType): Promise<KnowledgeUnit[]> {
        return await kuRepository.search(query, type);
    }
}

export const knowledgeService = new KnowledgeService();
