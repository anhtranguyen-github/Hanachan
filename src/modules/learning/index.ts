import { SQLiteLearningRepository } from "./infrastructure/SQLiteLearningRepository";

export const learningRepository = new SQLiteLearningRepository();

export * from "./domain/interfaces/ILearningRepository";
export * from "./domain/SRSAlgorithm";
export * from "./infrastructure/SQLiteLearningRepository";
