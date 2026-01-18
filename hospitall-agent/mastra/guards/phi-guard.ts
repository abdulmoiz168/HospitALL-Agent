import { StructuredFeatures, TriageInput } from "../schemas/triage";

const DIRECT_IDENTIFIER_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  // Email addresses
  { label: "email", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },

  // US/Canada phone numbers
  {
    label: "phone",
    regex: /\b(\+?1[-.\s]?)?(\(?\d{3}\)?)[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },

  // International phone numbers (various formats)
  {
    label: "phone_intl",
    regex: /\b\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
  },

  // Pakistani phone numbers
  {
    label: "phone_pk",
    regex: /\b(0|\+92[-.\s]?)?(3\d{2}[-.\s]?\d{7}|[1-9]\d{1,2}[-.\s]?\d{7})\b/g,
  },

  // Social Security Numbers
  { label: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },

  // Medical Record Numbers
  { label: "mrn", regex: /\bMRN[:\s]*[A-Z0-9-]{5,}\b/gi },

  // Street addresses (US format)
  {
    label: "address",
    regex: /\b\d{1,5}\s+[A-Za-z0-9.\s]{3,}\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
  },

  // Pakistani/South Asian addresses
  {
    label: "address_pk",
    regex: /\b(House|Plot|Flat|Apartment|Block|Sector)\s*[#\d\w-]+[,\s]+[A-Za-z\s]+,?\s*(Town|Colony|Society|Phase|Scheme|Road|Street)\b/gi,
  },

  // Date of birth patterns
  {
    label: "dob",
    regex: /\b(DOB|date of birth|born on|birthday)[:\s]*([\d]{1,2}[-/.][\d]{1,2}[-/.][\d]{2,4}|\w+\s+\d{1,2},?\s+\d{4})\b/gi,
  },

  // Name introduction patterns - "my name is X", "I am X", "this is X"
  {
    label: "name_intro",
    regex: /\b(my name is|i am|i'm|this is|call me|named)\s+([A-Z][a-z]+(\s+[A-Z][a-z]+)?)\b/gi,
  },

  // CNIC/National ID (Pakistan)
  {
    label: "cnic",
    regex: /\b\d{5}[-]?\d{7}[-]?\d{1}\b/g,
  },
];

const SYMPTOM_KEYWORDS = [
  "chest pain",
  "shortness of breath",
  "difficulty breathing",
  "severe headache",
  "fainting",
  "loss of consciousness",
  "severe bleeding",
  "uncontrolled bleeding",
  "confusion",
  "stroke",
  "seizure",
  "high fever",
  "stiff neck",
  "severe abdominal pain",
  "vomiting blood",
  "bloody stool",
  "allergic reaction",
  "swelling of face",
  "trouble swallowing",
  "pregnant",
  "fever",
  "cough",
  "nausea",
  "vomiting",
  "diarrhea",
  "rash",
  "dizziness",
  "fatigue",
];

const normalize = (value: string) => value.toLowerCase();

const extractSymptoms = (text: string) => {
  const normalized = normalize(text);
  return SYMPTOM_KEYWORDS.filter((keyword) => normalized.includes(keyword));
};

const inferAgeBand = (ageYears?: number) => {
  if (ageYears === undefined) return undefined;
  if (ageYears < 18) return "child";
  if (ageYears >= 65) return "older";
  return "adult";
};

export const sanitizeText = (text: string) => {
  let sanitizedText = text;
  const directIdentifiersDetected: string[] = [];

  for (const pattern of DIRECT_IDENTIFIER_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(sanitizedText)) {
      directIdentifiersDetected.push(pattern.label);
      sanitizedText = sanitizedText.replace(
        pattern.regex,
        `[REDACTED:${pattern.label.toUpperCase()}]`,
      );
    }
  }

  return { sanitizedText, directIdentifiersDetected };
};

export const buildStructuredFeatures = (
  text: string,
  ageYears?: number,
  severity?: number,
  durationHours?: number,
): StructuredFeatures => ({
  ageBand: inferAgeBand(ageYears),
  symptomKeywords: extractSymptoms(text),
  severity,
  durationHours,
});

export const phiGuard = (input: TriageInput) => {
  const { sanitizedText, directIdentifiersDetected } = sanitizeText(input.text);
  const structured = buildStructuredFeatures(
    sanitizedText,
    input.ageYears,
    input.severity,
    input.durationHours,
  );

  return {
    sanitizedText,
    directIdentifiersDetected,
    blockedExternal: directIdentifiersDetected.length > 0,
    structured,
  };
};
