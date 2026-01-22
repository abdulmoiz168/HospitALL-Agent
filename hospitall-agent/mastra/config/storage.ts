import { LibSQLStore } from "@mastra/libsql";

// Only create storage if a proper database URL is configured
// File-based storage (file:./...) doesn't work on Vercel serverless
const createStorage = () => {
  const dbUrl = process.env.MASTRA_DB_URL;

  // Skip storage if no URL configured or if it's a file URL (won't work on Vercel)
  if (!dbUrl || dbUrl.startsWith("file:")) {
    console.log("[mastra/storage] No remote database configured, storage disabled");
    return undefined;
  }

  return new LibSQLStore({
    id: "hospitall-storage",
    url: dbUrl,
  });
};

export const storage = createStorage();
