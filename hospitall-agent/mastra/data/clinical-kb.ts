export type ClinicalChunk = {
  source_id: string;
  chunk_id: string;
  text: string;
  tags: string[];
};

export const CLINICAL_KB: ClinicalChunk[] = [
  {
    source_id: "triage_emergency_guidelines_2024",
    chunk_id: "triage_emergency_001",
    text: "Emergency evaluation is recommended for chest pain, severe breathing difficulty, or loss of consciousness.",
    tags: ["triage", "emergency", "chest pain", "breathing"],
  },
  {
    source_id: "triage_urgent_guidelines_2024",
    chunk_id: "triage_urgent_010",
    text: "Severe or rapidly worsening symptoms should be assessed in urgent care or same-day clinical settings.",
    tags: ["triage", "urgent"],
  },
  {
    source_id: "triage_primary_guidelines_2024",
    chunk_id: "triage_primary_020",
    text: "Persistent symptoms without red flags should be assessed by primary care within a few days.",
    tags: ["triage", "primary"],
  },
  {
    source_id: "report_interpretation_guidelines_2024",
    chunk_id: "report_ranges_001",
    text: "Interpret laboratory values in the context of provided reference ranges and patient context; avoid definitive diagnosis based on isolated values.",
    tags: ["report", "reference"],
  },
  {
    source_id: "med_safety_guidelines_2024",
    chunk_id: "med_interactions_001",
    text: "Medication interaction severity should be derived from verified interaction databases and communicated with appropriate escalation guidance.",
    tags: ["rx", "interactions"],
  },
];
