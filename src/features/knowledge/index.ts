
import { knowledgeService } from "./service";

// Export the service as the primary entry point
export { knowledgeService };

export * from "./types";
// Do not export repo directly to enforce service usage layer
// export * from "./knowledge.repo";
