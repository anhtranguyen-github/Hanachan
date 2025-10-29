import { SQLiteKURepository } from "./infrastructure/SQLiteKURepository";

// Export a single instance for the app to use
export const kuRepository = new SQLiteKURepository();

export * from "./domain/interfaces/IKURepository";
export * from "./infrastructure/SQLiteKURepository";
