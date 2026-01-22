import { StructuredFeatures, TriageDecisionCore } from "../schemas/triage";

const buildRationale = (
  level: TriageDecisionCore["urgency_level"],
  structured: StructuredFeatures,
  redFlags: string[],
) => {
  if (level === "emergency") {
    return `Symptoms include ${redFlags.join(", ")}; these can signal urgent conditions that require immediate evaluation.`;
  }

  if (level === "urgent_care") {
    return "Symptoms appear intense or rapidly worsening, which may benefit from same-day clinical evaluation.";
  }

  if (level === "primary_care") {
    return "Symptoms are persistent but not clearly emergent; a clinician visit is recommended for assessment.";
  }

  const hasSymptoms = structured.symptomKeywords.length > 0;
  return hasSymptoms
    ? "Symptoms appear mild and stable; self-care and monitoring are appropriate, with escalation if things worsen."
    : "No specific red-flag symptoms detected; monitor for changes and seek care if symptoms evolve.";
};

const possibleCauseMap: Array<{ keywords: string[]; causes: string[] }> = [
  {
    keywords: ["cough", "fever"],
    causes: ["Viral respiratory infection", "Seasonal allergies", "Bronchitis"],
  },
  {
    keywords: ["headache", "severe headache"],
    causes: ["Tension headache", "Dehydration", "Migraine"],
  },
  {
    keywords: ["nausea", "vomiting", "diarrhea"],
    causes: ["Gastroenteritis", "Food intolerance", "Medication side effects"],
  },
  {
    keywords: ["rash"],
    causes: ["Contact dermatitis", "Allergic reaction", "Viral rash"],
  },
  {
    keywords: ["fatigue"],
    causes: ["Sleep disruption", "Stress", "Viral illness"],
  },
  {
    keywords: ["fever"],
    causes: ["Viral infection", "Bacterial infection", "Inflammatory response"],
  },
  {
    keywords: ["severe abdominal pain"],
    causes: ["Gastritis", "Gallbladder irritation", "Appendicitis"],
  },
];

const suggestPossibleCauses = (
  structured: StructuredFeatures,
  urgency: TriageDecisionCore["urgency_level"],
  redFlags: string[],
) => {
  if (urgency === "emergency" || redFlags.length > 0) return undefined;

  const matched: string[] = [];
  for (const entry of possibleCauseMap) {
    if (entry.keywords.some((keyword) =>
      structured.symptomKeywords.includes(keyword),
    )) {
      for (const cause of entry.causes) {
        if (!matched.includes(cause)) {
          matched.push(cause);
        }
      }
    }
  }

  return matched.length > 0 ? matched.slice(0, 3) : undefined;
};

const buildRecommendedAction = (
  level: TriageDecisionCore["urgency_level"],
) => {
  if (level === "emergency") {
    return {
      primary: "CALL EMERGENCY SERVICES IMMEDIATELY: Rescue 1122 (Punjab/KP/AJK) or Edhi 115 (nationwide), or go to the nearest hospital emergency department NOW.",
      secondary: "If you are alone, contact someone nearby immediately. Do NOT drive yourself - have someone take you or call an ambulance.",
    };
  }

  if (level === "urgent_care") {
    return {
      primary: "Seek urgent care or same-day clinical evaluation at a hospital or clinic.",
      secondary: "If symptoms worsen (especially difficulty breathing, chest pain, or confusion), call Rescue 1122 or Edhi 115 immediately.",
    };
  }

  if (level === "primary_care") {
    return {
      primary: "Schedule a visit with your doctor within the next few days.",
      secondary: "Track your symptoms and seek urgent care sooner if they worsen significantly.",
    };
  }

  return {
    primary: "Self-care and monitoring are reasonable at this time.",
    secondary: "Seek medical care if symptoms worsen or new concerning symptoms appear (chest pain, difficulty breathing, severe pain, confusion).",
  };
};

export const triageDecision = (
  structured: StructuredFeatures,
  redFlags: string[],
): TriageDecisionCore => {
  if (redFlags.length > 0) {
    return {
      urgency_level: "emergency",
      red_flags_detected: redFlags,
      risk_rationale: buildRationale("emergency", structured, redFlags),
      possible_causes: undefined,
      recommended_action: buildRecommendedAction("emergency"),
      system_action: "emergency_circuit_breaker",
    };
  }

  const severity = structured.severity ?? 0;
  const durationHours = structured.durationHours ?? 0;

  if (severity >= 8) {
    return {
      urgency_level: "urgent_care",
      red_flags_detected: [],
      risk_rationale: buildRationale("urgent_care", structured, redFlags),
      possible_causes: suggestPossibleCauses(structured, "urgent_care", redFlags),
      recommended_action: buildRecommendedAction("urgent_care"),
      system_action: "none",
    };
  }

  if (durationHours >= 72) {
    return {
      urgency_level: "primary_care",
      red_flags_detected: [],
      risk_rationale: buildRationale("primary_care", structured, redFlags),
      possible_causes: suggestPossibleCauses(structured, "primary_care", redFlags),
      recommended_action: buildRecommendedAction("primary_care"),
      system_action: "none",
    };
  }

  return {
    urgency_level: "self_care",
    red_flags_detected: [],
    risk_rationale: buildRationale("self_care", structured, redFlags),
    possible_causes: suggestPossibleCauses(structured, "self_care", redFlags),
    recommended_action: buildRecommendedAction("self_care"),
    system_action: "none",
  };
};
