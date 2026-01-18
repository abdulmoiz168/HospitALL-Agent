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
      primary: "Call emergency services now or go to the nearest emergency department.",
      secondary: "If you are alone, contact someone nearby and keep your phone accessible.",
    };
  }

  if (level === "urgent_care") {
    return {
      primary: "Seek urgent care or same-day clinical evaluation.",
      secondary: "If symptoms worsen, go to the emergency department.",
    };
  }

  if (level === "primary_care") {
    return {
      primary: "Schedule a primary care visit within the next few days.",
      secondary: "Track symptoms and seek sooner care if they worsen.",
    };
  }

  return {
    primary: "Self-care and monitoring are reasonable at this time.",
    secondary: "Seek medical care if new red-flag symptoms appear.",
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
