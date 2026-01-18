import { StructuredFeatures } from "../schemas/triage";

export type Intent = "triage" | "rx" | "report" | "unknown";

const TRIAGE_KEYWORDS = [
  "symptom",
  "pain",
  "fever",
  "cough",
  "shortness of breath",
  "dizzy",
  "nausea",
  "vomit",
  "rash",
  "headache",
  "chest",
  "emergency",
  "urgent",
];

const RX_KEYWORDS = [
  "med",
  "medication",
  "drug",
  "prescription",
  "dose",
  "interaction",
  "contraindication",
  "side effect",
  "rx",
  "pharmacy",
];

const REPORT_KEYWORDS = [
  "lab",
  "report",
  "test result",
  "blood",
  "cbc",
  "panel",
  "reference range",
  "value",
  "results",
];

const containsKeyword = (text: string, keywords: string[]) => {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export const detectIntent = (
  text: string,
  structured?: StructuredFeatures,
): Intent => {
  if (structured && structured.symptomKeywords.length > 0) {
    return "triage";
  }

  if (containsKeyword(text, RX_KEYWORDS)) {
    return "rx";
  }

  if (containsKeyword(text, REPORT_KEYWORDS)) {
    return "report";
  }

  if (containsKeyword(text, TRIAGE_KEYWORDS)) {
    return "triage";
  }

  return "unknown";
};
