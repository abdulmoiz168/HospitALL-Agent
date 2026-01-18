import { CLINICAL_KB } from "../data/clinical-kb";
import { CitationSchema } from "../schemas/common";

export const selectCitations = (tags: string[]) => {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  const matches = CLINICAL_KB.filter((chunk) =>
    chunk.tags.some((tag) => lowerTags.includes(tag.toLowerCase())),
  );

  return matches.map((chunk) =>
    CitationSchema.parse({
      source_id: chunk.source_id,
      chunk_id: chunk.chunk_id,
      support: chunk.text,
    }),
  );
};
