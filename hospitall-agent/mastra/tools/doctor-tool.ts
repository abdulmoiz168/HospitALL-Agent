import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { DoctorSchema, SpecialtyEnum, Specialty } from "../schemas/doctor";
import { MOCK_DOCTORS } from "../data/doctors";

// Mapping from conditions to relevant specialties (simplified to 3 specialties for demo)
const conditionToSpecialtyMap: Record<string, Specialty[]> = {
  // Cardiovascular
  "coronary artery disease": ["cardiology"],
  "heart disease": ["cardiology"],
  "heart failure": ["cardiology"],
  hypertension: ["cardiology", "internal_medicine"],
  "high blood pressure": ["cardiology", "internal_medicine"],
  "myocardial infarction": ["cardiology"],
  "heart attack": ["cardiology"],
  arrhythmia: ["cardiology"],
  hyperlipidemia: ["cardiology", "endocrinology"],
  "high cholesterol": ["cardiology", "endocrinology"],

  // Endocrine
  diabetes: ["endocrinology", "internal_medicine"],
  "type 2 diabetes": ["endocrinology", "internal_medicine"],
  "type 1 diabetes": ["endocrinology"],
  "gestational diabetes": ["endocrinology"],
  "thyroid disorder": ["endocrinology"],
  hypothyroidism: ["endocrinology"],
  hyperthyroidism: ["endocrinology"],
  pcos: ["endocrinology"],
  "polycystic ovary syndrome": ["endocrinology"],
  osteoporosis: ["endocrinology"],

  // Internal Medicine (general conditions)
  "chronic kidney disease": ["internal_medicine"],
  ckd: ["internal_medicine"],
  "kidney disease": ["internal_medicine"],
  asthma: ["internal_medicine"],
  copd: ["internal_medicine"],
  pneumonia: ["internal_medicine"],
  bronchitis: ["internal_medicine"],
  "general checkup": ["internal_medicine"],
  "preventive care": ["internal_medicine"],
};

// Mapping from symptoms to relevant specialties (simplified to 3 specialties for demo)
const symptomToSpecialtyMap: Record<string, Specialty[]> = {
  // Cardiac symptoms
  "chest pain": ["cardiology", "internal_medicine"],
  palpitations: ["cardiology"],
  "shortness of breath": ["cardiology", "internal_medicine"],
  "leg swelling": ["cardiology", "internal_medicine"],
  dizziness: ["cardiology", "internal_medicine"],
  fainting: ["cardiology", "internal_medicine"],

  // Respiratory symptoms (route to internal medicine)
  cough: ["internal_medicine"],
  wheezing: ["internal_medicine"],
  "breathing difficulty": ["cardiology", "internal_medicine"],

  // Metabolic symptoms
  "frequent urination": ["endocrinology", "internal_medicine"],
  "excessive thirst": ["endocrinology"],
  fatigue: ["endocrinology", "internal_medicine"],
  "weight loss": ["endocrinology", "internal_medicine"],
  "weight gain": ["endocrinology"],

  // GI symptoms (route to internal medicine)
  "abdominal pain": ["internal_medicine"],
  nausea: ["internal_medicine"],
  vomiting: ["internal_medicine"],

  // General symptoms (route to internal medicine)
  fever: ["internal_medicine"],
  headache: ["internal_medicine"],
  "joint pain": ["internal_medicine"],
  "back pain": ["internal_medicine"],
  rash: ["internal_medicine"],
};

// Input schema for doctor recommendation tool
const DoctorToolInputSchema = z.object({
  specialty: SpecialtyEnum.optional().describe(
    "Filter by specific medical specialty"
  ),
  symptoms: z
    .array(z.string())
    .optional()
    .describe("List of symptoms to match relevant specialists"),
  conditions: z
    .array(z.string())
    .optional()
    .describe("List of medical conditions to match relevant specialists"),
  acceptingNewPatients: z
    .boolean()
    .optional()
    .describe("Filter to only doctors accepting new patients"),
});

// Doctor with relevance score for output
const RecommendedDoctorSchema = DoctorSchema.extend({
  relevanceScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Relevance score from 0-100 based on matching criteria"),
  matchedCriteria: z
    .array(z.string())
    .describe("List of matched criteria that contributed to the score"),
});

// Output schema
const DoctorToolOutputSchema = z.object({
  success: z.boolean(),
  doctors: z.array(RecommendedDoctorSchema),
  totalFound: z.number(),
  message: z.string().optional(),
});

// Helper function to normalize string for matching
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

// Helper function to find matching specialties for a condition or symptom
function findSpecialtiesForTerm(
  term: string,
  map: Record<string, Specialty[]>
): Specialty[] {
  const normalizedTerm = normalize(term);
  const specialties: Specialty[] = [];

  for (const [key, value] of Object.entries(map)) {
    if (normalizedTerm.includes(key) || key.includes(normalizedTerm)) {
      specialties.push(...value);
    }
  }

  return Array.from(new Set(specialties));
}

export const doctorTool = createTool({
  id: "doctor-tool",
  description:
    "Recommend doctors based on specialty, symptoms, or medical conditions. Returns doctors with relevance scores based on how well they match the search criteria.",
  inputSchema: DoctorToolInputSchema,
  outputSchema: DoctorToolOutputSchema,
  execute: async (inputData) => {
    const { specialty, symptoms, conditions, acceptingNewPatients } = inputData;

    let candidates = [...MOCK_DOCTORS];

    // Filter by acceptingNewPatients if specified
    if (acceptingNewPatients === true) {
      candidates = candidates.filter((d) => d.acceptingNewPatients === true);
    }

    // Collect all relevant specialties from conditions and symptoms
    const relevantSpecialties: Set<Specialty> = new Set();

    if (specialty) {
      relevantSpecialties.add(specialty);
    }

    if (conditions) {
      for (const condition of conditions) {
        const specialties = findSpecialtiesForTerm(
          condition,
          conditionToSpecialtyMap
        );
        specialties.forEach((s) => relevantSpecialties.add(s));
      }
    }

    if (symptoms) {
      for (const symptom of symptoms) {
        const specialties = findSpecialtiesForTerm(
          symptom,
          symptomToSpecialtyMap
        );
        specialties.forEach((s) => relevantSpecialties.add(s));
      }
    }

    // Score and filter doctors
    const scoredDoctors = candidates.map((doctor) => {
      let score = 0;
      const matchedCriteria: string[] = [];

      // Exact specialty match
      if (specialty && doctor.specialty === specialty) {
        score += 50;
        matchedCriteria.push(`Specialty: ${specialty}`);
      }

      // Specialty matches derived from conditions/symptoms
      if (relevantSpecialties.has(doctor.specialty)) {
        if (!matchedCriteria.some((c) => c.startsWith("Specialty:"))) {
          score += 40;
          matchedCriteria.push(`Related specialty: ${doctor.specialty}`);
        }
      }

      // Check subspecialties
      if (doctor.subSpecialties) {
        for (const subSpec of doctor.subSpecialties) {
          const normalizedSubSpec = normalize(subSpec);

          if (conditions) {
            for (const condition of conditions) {
              if (
                normalizedSubSpec.includes(normalize(condition)) ||
                normalize(condition).includes(normalizedSubSpec)
              ) {
                score += 15;
                matchedCriteria.push(`Subspecialty match: ${subSpec}`);
              }
            }
          }

          if (symptoms) {
            for (const symptom of symptoms) {
              if (
                normalizedSubSpec.includes(normalize(symptom)) ||
                normalize(symptom).includes(normalizedSubSpec)
              ) {
                score += 10;
                matchedCriteria.push(`Subspecialty match: ${subSpec}`);
              }
            }
          }
        }
      }

      // Rating bonus (up to 10 points for 5-star rating)
      score += doctor.rating * 2;

      // Experience bonus (up to 10 points)
      if (doctor.yearsOfExperience) {
        score += Math.min(doctor.yearsOfExperience / 3, 10);
      }

      // Accepting new patients bonus
      if (doctor.acceptingNewPatients) {
        score += 5;
        matchedCriteria.push("Accepting new patients");
      }

      // Normalize score to 0-100
      const normalizedScore = Math.min(Math.round(score), 100);

      return {
        ...doctor,
        relevanceScore: normalizedScore,
        matchedCriteria: Array.from(new Set(matchedCriteria)),
      };
    });

    // Filter to only include relevant doctors (score > 10 or no criteria specified)
    const hasSearchCriteria =
      specialty || (conditions && conditions.length > 0) || (symptoms && symptoms.length > 0);

    let filteredDoctors = hasSearchCriteria
      ? scoredDoctors.filter((d) => d.relevanceScore > 10)
      : scoredDoctors;

    // Sort by relevance score descending
    filteredDoctors.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Generate message
    let message: string;
    if (filteredDoctors.length === 0) {
      message = "No doctors found matching your criteria.";
    } else if (hasSearchCriteria) {
      message = `Found ${filteredDoctors.length} doctor(s) matching your criteria.`;
    } else {
      message = `Showing all ${filteredDoctors.length} available doctors.`;
    }

    return {
      success: true,
      doctors: filteredDoctors,
      totalFound: filteredDoctors.length,
      message,
    };
  },
});
