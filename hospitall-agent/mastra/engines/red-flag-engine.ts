import { StructuredFeatures } from "../schemas/triage";

// Comprehensive red flag keywords for emergency detection
// Organized by medical category for maintainability
const RED_FLAG_KEYWORDS = [
  // === CARDIAC EMERGENCIES ===
  "chest pain",
  "chest tightness",
  "chest pressure",
  "crushing chest pain",
  "heart attack",
  "heart pain",
  "irregular heartbeat",
  "rapid heartbeat",
  "racing heart",
  "palpitations",
  "heart pounding",

  // === RESPIRATORY EMERGENCIES ===
  "shortness of breath",
  "difficulty breathing",
  "can't breathe",
  "cannot breathe",
  "unable to breathe",
  "gasping for air",
  "choking",
  "blue lips",
  "bluish lips",
  "cyanosis",
  "wheezing severely",
  "severe asthma attack",

  // === NEUROLOGICAL EMERGENCIES ===
  "stroke",
  "stroke symptoms",
  "face drooping",
  "arm weakness",
  "slurred speech",
  "sudden numbness",
  "sudden weakness",
  "loss of consciousness",
  "unconscious",
  "passed out",
  "fainting",
  "fainted",
  "seizure",
  "convulsion",
  "fitting",
  "confusion",
  "sudden confusion",
  "disoriented",
  "altered mental status",
  "not responding",
  "unresponsive",
  "difficult to wake",
  "won't wake up",

  // === SEVERE HEADACHE (Possible stroke, aneurysm, meningitis) ===
  "worst headache",
  "worst headache of my life",
  "thunderclap headache",
  "sudden severe headache",
  "severe headache",
  "intense headache",
  "headache with stiff neck",
  "headache with fever",
  "headache with confusion",

  // === ANAPHYLAXIS / SEVERE ALLERGIC REACTION ===
  "anaphylaxis",
  "severe allergic reaction",
  "allergic shock",
  "throat closing",
  "throat tightness",
  "throat swelling",
  "tongue swelling",
  "swollen tongue",
  "lips swelling",
  "swelling of face",
  "facial swelling",
  "face swelling",
  "swollen face",
  "trouble swallowing",
  "difficulty swallowing",
  "can't swallow",
  "hives all over",
  "hives everywhere",
  "whole body rash",
  "swelling and rash",
  "allergic reaction breathing",

  // === BLEEDING EMERGENCIES ===
  "severe bleeding",
  "uncontrolled bleeding",
  "heavy bleeding",
  "bleeding won't stop",
  "vomiting blood",
  "coughing blood",
  "blood in vomit",
  "bloody stool",
  "black stool",
  "blood in stool",
  "rectal bleeding",

  // === ABDOMINAL EMERGENCIES ===
  "severe abdominal pain",
  "severe stomach pain",
  "worst stomach pain",
  "rigid abdomen",
  "abdominal rigidity",

  // === TRAUMA ===
  "head injury",
  "severe head injury",
  "hit head and confused",
  "head trauma",
  "fall and unconscious",
  "severe accident",
  "major injury",

  // === PREGNANCY EMERGENCIES ===
  "heavy vaginal bleeding",
  "pregnant and bleeding",
  "severe pregnancy pain",
  "water broke early",
  "premature labor",

  // === PEDIATRIC RED FLAGS ===
  "baby not breathing",
  "infant not responding",
  "child unconscious",
  "baby blue",
  "child seizure",
  "high fever in infant",
  "bulging fontanelle",

  // === DIABETIC EMERGENCIES ===
  "diabetic emergency",
  "very low blood sugar",
  "very high blood sugar",
  "diabetic coma",
  "fruity breath",
  "excessive thirst and confusion",

  // === OVERDOSE / POISONING ===
  "overdose",
  "poisoning",
  "took too many pills",
  "drug overdose",
  "medicine overdose",

  // === MENINGITIS SYMPTOMS ===
  "stiff neck with fever",
  "neck stiffness and headache",
  "rash that doesn't fade",
  "petechial rash",

  // === SEPSIS INDICATORS ===
  "sepsis",
  "infection spreading",
  "fever and confusion",
  "very sick",
  "deteriorating rapidly",
];

// Combination patterns that indicate emergency even if individual keywords seem mild
const EMERGENCY_COMBINATIONS = [
  ["headache", "stiff neck"],
  ["headache", "fever", "confusion"],
  ["rash", "fever", "stiff neck"],
  ["swelling", "difficulty breathing"],
  ["hives", "difficulty breathing"],
  ["chest pain", "sweating"],
  ["chest pain", "arm pain"],
  ["pregnant", "bleeding"],
  ["diabetic", "confusion"],
  ["fever", "confusion"],
];

export const detectRedFlags = (structured: StructuredFeatures) => {
  const symptoms = structured.symptomKeywords.map((k) => k.toLowerCase());
  const originalText = symptoms.join(" ");

  // Direct keyword matching
  const directMatches = symptoms.filter((keyword) =>
    RED_FLAG_KEYWORDS.some(
      (redFlag) =>
        keyword.includes(redFlag) || redFlag.includes(keyword)
    )
  );

  // Also check if the combined text contains any red flag phrases
  const phraseMatches = RED_FLAG_KEYWORDS.filter((redFlag) =>
    originalText.includes(redFlag.toLowerCase())
  );

  // Check for emergency combinations
  const combinationMatches: string[] = [];
  for (const combination of EMERGENCY_COMBINATIONS) {
    const allPresent = combination.every((term) =>
      symptoms.some((s) => s.includes(term))
    );
    if (allPresent) {
      combinationMatches.push(`combination: ${combination.join(" + ")}`);
    }
  }

  // Deduplicate and combine all matches
  const allRedFlags = [
    ...new Set([...directMatches, ...phraseMatches, ...combinationMatches]),
  ];

  const emergency = allRedFlags.length > 0;

  return { redFlags: allRedFlags, emergency };
};
