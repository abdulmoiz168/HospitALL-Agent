import { Memory } from "@mastra/memory";
import { storage, vectorStore } from "./storage";
import { getEmbeddingModel, hasEmbeddingKey } from "../utils/llm";

/**
 * Create memory configuration for HospitALL agents.
 *
 * Features:
 * - Per-account memory (scope: "resource" - each user has separate memory across threads)
 * - Semantic recall for finding relevant past conversations
 * - Working memory for maintaining patient profile context
 */
const createMemory = () => {
  // Memory requires both storage and embeddings
  if (!storage) {
    console.log("[mastra/memory] Storage not configured - memory disabled");
    return undefined;
  }

  if (!hasEmbeddingKey()) {
    console.log("[mastra/memory] Embedding API key not configured - memory disabled");
    return undefined;
  }

  try {
    return new Memory({
      storage,
      vector: vectorStore || false,
      embedder: vectorStore ? getEmbeddingModel() : undefined,
      options: {
        // Keep last 10 messages in context
        lastMessages: 10,

        // Enable semantic recall for finding relevant past conversations
        semanticRecall: vectorStore
          ? {
              topK: 3,
              messageRange: { before: 1, after: 1 },
              scope: "resource", // Per-user memory across all threads
            }
          : false,

        // Working memory for maintaining patient profile
        workingMemory: {
          enabled: true,
          scope: "resource", // Per-user working memory
          template: `# Patient Profile
- **Age**:
- **Sex at Birth**:
- **Medical History**:
- **Current Conditions**:
- **Allergies**:
- **Current Medications**:
- **Preferences**:
- **Important Notes**:
`,
        },
      },
    });
  } catch (error) {
    console.error("[mastra/memory] Failed to create memory:", error);
    return undefined;
  }
};

export const memory = createMemory();

// Log configuration status
if (memory) {
  console.log("[mastra/memory] Memory configured with per-account scope");
} else {
  console.log("[mastra/memory] Memory not configured - some features disabled");
}
