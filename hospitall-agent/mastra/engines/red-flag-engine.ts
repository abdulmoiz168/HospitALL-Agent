import { StructuredFeatures } from "../schemas/triage";

const RED_FLAG_KEYWORDS = [
  "chest pain",
  "shortness of breath",
  "difficulty breathing",
  "loss of consciousness",
  "fainting",
  "stroke",
  "seizure",
  "severe bleeding",
  "uncontrolled bleeding",
  "confusion",
  "vomiting blood",
  "bloody stool",
  "severe abdominal pain",
  "swelling of face",
  "trouble swallowing",
];

export const detectRedFlags = (structured: StructuredFeatures) => {
  const redFlags = structured.symptomKeywords.filter((keyword) =>
    RED_FLAG_KEYWORDS.includes(keyword),
  );

  const emergency = redFlags.length > 0;

  return { redFlags, emergency };
};
