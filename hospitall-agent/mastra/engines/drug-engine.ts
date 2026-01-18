import {
  NormalizedDrug,
  PrescriptionInput,
  RxIssue,
} from "../schemas/prescription";

const RXNORM_MAP: Record<string, NormalizedDrug> = {
  warfarin: { name: "Warfarin", rxcui: "11289" },
  aspirin: { name: "Aspirin", rxcui: "1191" },
  ibuprofen: { name: "Ibuprofen", rxcui: "5640" },
  metformin: { name: "Metformin", rxcui: "6809" },
  lisinopril: { name: "Lisinopril", rxcui: "29046" },
  isotretinoin: { name: "Isotretinoin", rxcui: "7592" },
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

export const normalizeDrugs = (meds: string[]) => {
  const normalized: NormalizedDrug[] = [];
  const unknown: string[] = [];

  for (const med of meds) {
    const key = normalizeKey(med);
    const match = RXNORM_MAP[key];
    if (match) {
      normalized.push(match);
    } else {
      unknown.push(med);
    }
  }

  return { normalized, unknown };
};

const interactionPairs: Array<{
  rxcuis: [string, string];
  severity: RxIssue["severity"];
  mechanism: string;
  management: string;
}> = [
  {
    rxcuis: ["11289", "1191"],
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_warfarin_aspirin",
    management: "Consult prescriber immediately; bleeding risk may be elevated.",
  },
  {
    rxcuis: ["11289", "5640"],
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_warfarin_ibuprofen",
    management: "Discuss alternatives with a clinician; monitor for bleeding.",
  },
];

const containsPair = (rxcuis: string[], pair: [string, string]) => {
  return (
    rxcuis.includes(pair[0]) && rxcuis.includes(pair[1])
  );
};

export const checkInteractions = (
  input: PrescriptionInput,
  normalized: NormalizedDrug[],
): RxIssue[] => {
  const issues: RxIssue[] = [];
  const rxcuis = normalized.map((drug) => drug.rxcui);

  for (const interaction of interactionPairs) {
    if (containsPair(rxcuis, interaction.rxcuis)) {
      const involved = normalized.filter((drug) =>
        interaction.rxcuis.includes(drug.rxcui),
      );
      issues.push({
        type: "interaction",
        severity: interaction.severity,
        normalized_drugs: involved,
        mechanism: interaction.mechanism,
        management: interaction.management,
        evidence_source: "DrugEngine:v1",
      });
    }
  }

  const duplicates = new Set<string>();
  for (const drug of normalized) {
    if (duplicates.has(drug.rxcui)) {
      issues.push({
        type: "duplication",
        severity: "caution",
        normalized_drugs: [drug],
        mechanism: "DeterministicEngine:duplication",
        management: "Confirm if duplicate therapy is intentional with prescriber.",
        evidence_source: "DrugEngine:v1",
      });
    }
    duplicates.add(drug.rxcui);
  }

  if (input.pregnant) {
    const teratogens = normalized.filter((drug) => drug.rxcui === "7592");
    if (teratogens.length > 0) {
      issues.push({
        type: "contraindication",
        severity: "critical",
        normalized_drugs: teratogens,
        mechanism: "DeterministicEngine:pregnancy_contraindication",
        management: "Seek urgent clinician guidance about pregnancy risk.",
        evidence_source: "DrugEngine:v1",
      });
    }
  }

  return issues;
};
