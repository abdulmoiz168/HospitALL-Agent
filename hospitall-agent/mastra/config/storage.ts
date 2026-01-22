import { LibSQLStore } from "@mastra/libsql";

// Use LibSQLStore for local storage (as specified in .env MASTRA_DB_URL)
export const storage = new LibSQLStore({
  id: "hospitall-storage",
  url: process.env.MASTRA_DB_URL ?? "file:./mastra.db",
});
