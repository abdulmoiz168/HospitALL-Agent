import { CitationSchema } from "../schemas/common";

export const verifyCitations = (
  citations: Array<unknown>,
  minRequired = 1,
) => {
  const parsed = citations
    .map((citation) => CitationSchema.safeParse(citation))
    .filter((result) => result.success)
    .map((result) => result.data);

  return {
    ok: parsed.length >= minRequired,
    citations: parsed,
  };
};
