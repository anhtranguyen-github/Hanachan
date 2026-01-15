import { MockDB } from "@/lib/mock-db";
import { KUType } from "./types";

export const kuRepository = {
    async getBySlug(slug: string, type: KUType) {
        // Mock implementation
        const item = await MockDB.fetchItemDetails(type === 'vocabulary' ? 'vocab' : type, slug);
        return item;
    },

    async getAllByType(type: KUType, page: number = 1, limit: number = 30) {
        // Mock implementation
        const kus = await MockDB.searchKnowledgeUnits("");
        const filtered = kus.filter(k => k.type === type);
        const from = (page - 1) * limit;
        const to = from + limit;
        const data = filtered.slice(from, to);
        return { data, count: filtered.length };
    },

    async getByLevel(level: number, type: KUType) {
        const data = await MockDB.fetchLevelContent(level, "user-1");
        return data.filter(k => k.type === type);
    },

    async search(query: string, type?: KUType, page: number = 1, limit: number = 30) {
        const kus = await MockDB.searchKnowledgeUnits(query);
        const filtered = type ? kus.filter(k => k.type === type) : kus;
        const from = (page - 1) * limit;
        const to = from + limit;
        const data = filtered.slice(from, to);
        return { data, count: filtered.length };
    }
};

