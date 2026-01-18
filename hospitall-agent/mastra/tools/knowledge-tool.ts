import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Mock knowledge base documents
const MOCK_KNOWLEDGE_BASE = [
  {
    id: "kb_001",
    title: "Type 2 Diabetes Management Guidelines",
    category: "clinical_guidelines",
    content: `Type 2 Diabetes Management Overview:

    1. Glycemic Targets:
    - HbA1c goal: <7.0% for most adults
    - Fasting glucose: 80-130 mg/dL
    - Post-meal glucose: <180 mg/dL

    2. First-line Treatment:
    - Metformin is the preferred initial medication
    - Lifestyle modifications: diet, exercise, weight management

    3. Add-on Therapy:
    - Consider SGLT2 inhibitors or GLP-1 agonists for patients with CVD or CKD
    - Insulin therapy when oral medications insufficient

    4. Monitoring:
    - HbA1c every 3-6 months
    - Annual kidney function tests
    - Regular eye exams for retinopathy screening`,
    keywords: ["diabetes", "glucose", "hba1c", "metformin", "insulin", "blood sugar"],
  },
  {
    id: "kb_002",
    title: "Hypertension Treatment Protocol",
    category: "clinical_guidelines",
    content: `Hypertension Management Protocol:

    1. Blood Pressure Targets:
    - General: <130/80 mmHg
    - Elderly (>65): <140/90 mmHg may be appropriate
    - Diabetic patients: <130/80 mmHg

    2. Lifestyle Modifications:
    - DASH diet (low sodium, high potassium)
    - Regular aerobic exercise (150 min/week)
    - Weight reduction if overweight
    - Limit alcohol consumption

    3. First-line Medications:
    - ACE inhibitors or ARBs (especially with diabetes/CKD)
    - Calcium channel blockers
    - Thiazide diuretics

    4. Combination Therapy:
    - Often needed for optimal control
    - ACE/ARB + CCB or diuretic common combinations`,
    keywords: ["hypertension", "blood pressure", "ace inhibitor", "arb", "lisinopril"],
  },
  {
    id: "kb_003",
    title: "Chronic Kidney Disease Staging and Management",
    category: "clinical_guidelines",
    content: `CKD Staging by eGFR:

    Stage 1: eGFR >= 90 (normal, but kidney damage present)
    Stage 2: eGFR 60-89 (mild decrease)
    Stage 3a: eGFR 45-59 (mild-moderate decrease)
    Stage 3b: eGFR 30-44 (moderate-severe decrease)
    Stage 4: eGFR 15-29 (severe decrease)
    Stage 5: eGFR <15 (kidney failure)

    Management Principles:
    - Blood pressure control (ACE/ARB preferred)
    - Glycemic control in diabetic patients
    - Avoid nephrotoxic medications (NSAIDs, contrast)
    - Monitor potassium levels
    - Refer to nephrology at Stage 4 or earlier if progressing`,
    keywords: ["ckd", "kidney", "egfr", "creatinine", "nephrology", "renal"],
  },
  {
    id: "kb_004",
    title: "Gestational Diabetes Screening and Management",
    category: "obstetrics",
    content: `Gestational Diabetes Mellitus (GDM):

    Screening:
    - Universal screening at 24-28 weeks
    - OGTT: 75g or 100g glucose load
    - Diagnostic criteria vary by guideline

    Management:
    - Nutritional counseling (carbohydrate counting)
    - Blood glucose monitoring 4x/day
    - Fasting target: <95 mg/dL
    - 1-hour postprandial: <140 mg/dL
    - 2-hour postprandial: <120 mg/dL

    Treatment:
    - Diet and exercise first line
    - Insulin if targets not met (metformin can be considered)

    Postpartum:
    - Screen for T2DM at 4-12 weeks postpartum
    - Lifelong T2DM screening every 1-3 years`,
    keywords: ["gestational diabetes", "pregnancy", "glucose", "gdm", "prenatal"],
  },
  {
    id: "kb_005",
    title: "Coronary Artery Disease Secondary Prevention",
    category: "cardiology",
    content: `Secondary Prevention After MI/CAD:

    Medications (ABCDE):
    A - Antiplatelet therapy (aspirin + P2Y12 inhibitor for 12 months post-stent)
    B - Beta-blockers (reduce mortality post-MI)
    C - Cholesterol management (high-intensity statin, LDL <70)
    D - Diabetes/BP control
    E - Exercise and diet

    Lifestyle:
    - Cardiac rehabilitation program
    - Smoking cessation (critical)
    - Mediterranean diet
    - 150 min moderate exercise weekly

    Monitoring:
    - Lipid panel every 6-12 months
    - Regular cardiology follow-up
    - Stress testing as indicated`,
    keywords: ["cad", "heart attack", "mi", "stent", "aspirin", "statin", "cardiac"],
  },
  {
    id: "kb_006",
    title: "Drug Allergy Cross-Reactivity Guide",
    category: "pharmacology",
    content: `Common Drug Allergy Cross-Reactivity:

    Penicillin Allergies:
    - Cross-reactivity with cephalosporins: ~1-2% (lower than previously thought)
    - Carbapenems: Very low cross-reactivity
    - Aztreonam: Generally safe

    Sulfa Allergies:
    - Sulfonamide antibiotics (e.g., Bactrim)
    - Limited cross-reactivity with non-antibiotic sulfonamides
    - Thiazide diuretics generally safe despite sulfur moiety

    NSAID Allergies:
    - Cross-reactivity common within class
    - COX-2 inhibitors may be tolerated
    - Acetaminophen usually safe alternative

    Documentation:
    - Record specific reaction type
    - True allergy vs intolerance distinction important`,
    keywords: ["allergy", "drug allergy", "penicillin", "sulfa", "cross-reactivity"],
  },
  {
    id: "kb_007",
    title: "Prenatal Care Schedule and Testing",
    category: "obstetrics",
    content: `Prenatal Visit Schedule:

    First Trimester (weeks 1-12):
    - Initial visit: comprehensive history, labs, dating ultrasound
    - Labs: CBC, blood type, HIV, hepatitis B, rubella, syphilis
    - NIPT or first trimester screening offered

    Second Trimester (weeks 13-28):
    - Visits every 4 weeks
    - Anatomy ultrasound at 18-22 weeks
    - GDM screening at 24-28 weeks
    - Quad screen if NIPT not done

    Third Trimester (weeks 28-40):
    - Visits every 2 weeks until 36 weeks, then weekly
    - GBS culture at 35-37 weeks
    - Tdap vaccine at 27-36 weeks
    - Fetal growth monitoring

    High-Risk Considerations:
    - More frequent visits
    - Additional ultrasounds
    - Non-stress testing as indicated`,
    keywords: ["prenatal", "pregnancy", "obstetrics", "ultrasound", "trimester"],
  },
  {
    id: "kb_008",
    title: "Anxiety Disorder Management",
    category: "psychiatry",
    content: `Generalized Anxiety Disorder Treatment:

    First-Line Treatments:
    - SSRIs (sertraline, escitalopram)
    - SNRIs (venlafaxine, duloxetine)
    - Cognitive Behavioral Therapy (CBT)

    Adjunctive Therapies:
    - Buspirone for augmentation
    - Benzodiazepines for short-term/acute use only
    - Hydroxyzine as needed

    Non-Pharmacological:
    - Regular exercise
    - Sleep hygiene
    - Mindfulness and relaxation techniques
    - Limiting caffeine and alcohol

    Duration:
    - Continue medication 6-12 months after remission
    - Gradual taper when discontinuing`,
    keywords: ["anxiety", "gad", "ssri", "therapy", "mental health", "sertraline"],
  },
];

// Input schema for knowledge search
const KnowledgeToolInputSchema = z.object({
  query: z.string().describe("Search query to find relevant knowledge base documents"),
  category: z
    .enum(["clinical_guidelines", "obstetrics", "cardiology", "pharmacology", "psychiatry", "all"])
    .optional()
    .default("all")
    .describe("Optional category filter"),
  maxResults: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5)
    .describe("Maximum number of results to return"),
});

// Document excerpt schema
const DocumentExcerptSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  excerpt: z.string(),
  relevanceScore: z.number().min(0).max(100),
});

// Output schema
const KnowledgeToolOutputSchema = z.object({
  success: z.boolean(),
  results: z.array(DocumentExcerptSchema),
  totalFound: z.number(),
  query: z.string(),
  message: z.string().optional(),
});

// Helper function to calculate relevance score
function calculateRelevance(query: string, doc: typeof MOCK_KNOWLEDGE_BASE[0]): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  let score = 0;

  // Check title matches (high weight)
  const titleLower = doc.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleLower.includes(term)) {
      score += 30;
    }
  }

  // Check keyword matches (medium weight)
  for (const term of queryTerms) {
    for (const keyword of doc.keywords) {
      if (keyword.includes(term) || term.includes(keyword)) {
        score += 20;
      }
    }
  }

  // Check content matches (lower weight)
  const contentLower = doc.content.toLowerCase();
  for (const term of queryTerms) {
    if (contentLower.includes(term)) {
      score += 10;
    }
  }

  // Normalize to 0-100
  return Math.min(score, 100);
}

// Helper function to extract relevant excerpt
function extractExcerpt(query: string, content: string, maxLength: number = 500): string {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const lines = content.split("\n").filter((line) => line.trim());

  // Find lines that contain query terms
  const relevantLines: string[] = [];
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (queryTerms.some((term) => lineLower.includes(term))) {
      relevantLines.push(line.trim());
    }
  }

  // If we found relevant lines, join them
  if (relevantLines.length > 0) {
    let excerpt = relevantLines.join("\n");
    if (excerpt.length > maxLength) {
      excerpt = excerpt.substring(0, maxLength) + "...";
    }
    return excerpt;
  }

  // Otherwise return the beginning of the content
  return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
}

export const knowledgeTool = createTool({
  id: "knowledge-tool",
  description:
    "Search the HospitALL knowledge base for clinical guidelines, treatment protocols, drug information, and medical reference documents.",
  inputSchema: KnowledgeToolInputSchema,
  outputSchema: KnowledgeToolOutputSchema,
  execute: async ({ context }) => {
    const { query, category, maxResults } = context;

    // Filter by category if specified
    let documents = MOCK_KNOWLEDGE_BASE;
    if (category && category !== "all") {
      documents = documents.filter((doc) => doc.category === category);
    }

    // Score and rank documents
    const scoredDocs = documents
      .map((doc) => ({
        ...doc,
        relevanceScore: calculateRelevance(query, doc),
      }))
      .filter((doc) => doc.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    // Format results
    const results = scoredDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      excerpt: extractExcerpt(query, doc.content),
      relevanceScore: doc.relevanceScore,
    }));

    // Generate message
    let message: string;
    if (results.length === 0) {
      message = `No knowledge base documents found matching "${query}".`;
    } else {
      message = `Found ${results.length} relevant document(s) for "${query}".`;
    }

    return {
      success: true,
      results,
      totalFound: results.length,
      query,
      message,
    };
  },
});
