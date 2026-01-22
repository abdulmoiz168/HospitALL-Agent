import {
  NormalizedDrug,
  PrescriptionInput,
  RxIssue,
} from "../schemas/prescription";

// Drug categories for interaction checking
type DrugCategory =
  | "anticoagulant"
  | "antiplatelet"
  | "nsaid"
  | "ace_inhibitor"
  | "arb"
  | "potassium_sparing_diuretic"
  | "potassium_supplement"
  | "statin"
  | "fibrate"
  | "antidiabetic"
  | "sulfonylurea"
  | "insulin"
  | "maoi"
  | "ssri"
  | "snri"
  | "tca"
  | "benzodiazepine"
  | "opioid"
  | "antibiotic_fluoroquinolone"
  | "antibiotic_macrolide"
  | "antifungal_azole"
  | "ppi"
  | "h2_blocker"
  | "calcium_channel_blocker"
  | "beta_blocker"
  | "digoxin"
  | "lithium"
  | "methotrexate"
  | "teratogen"
  | "qt_prolonging"
  | "cns_depressant"
  | "serotonergic"
  | "nephrotoxic"
  | "hepatotoxic"
  | "other";

interface ExtendedDrug extends NormalizedDrug {
  categories: DrugCategory[];
  pregnancyCategory?: "A" | "B" | "C" | "D" | "X";
}

// Comprehensive drug database - 60+ medications common in Pakistan
const RXNORM_MAP: Record<string, ExtendedDrug> = {
  // === ANTICOAGULANTS & ANTIPLATELETS ===
  warfarin: { name: "Warfarin", rxcui: "11289", categories: ["anticoagulant"], pregnancyCategory: "X" },
  aspirin: { name: "Aspirin", rxcui: "1191", categories: ["antiplatelet", "nsaid"], pregnancyCategory: "D" },
  clopidogrel: { name: "Clopidogrel", rxcui: "32968", categories: ["antiplatelet"], pregnancyCategory: "B" },
  rivaroxaban: { name: "Rivaroxaban", rxcui: "1114195", categories: ["anticoagulant"], pregnancyCategory: "C" },
  dabigatran: { name: "Dabigatran", rxcui: "1037042", categories: ["anticoagulant"], pregnancyCategory: "C" },
  enoxaparin: { name: "Enoxaparin", rxcui: "67108", categories: ["anticoagulant"], pregnancyCategory: "B" },
  heparin: { name: "Heparin", rxcui: "5224", categories: ["anticoagulant"], pregnancyCategory: "C" },

  // === NSAIDs ===
  ibuprofen: { name: "Ibuprofen", rxcui: "5640", categories: ["nsaid"], pregnancyCategory: "D" },
  naproxen: { name: "Naproxen", rxcui: "7258", categories: ["nsaid"], pregnancyCategory: "D" },
  diclofenac: { name: "Diclofenac", rxcui: "3355", categories: ["nsaid"], pregnancyCategory: "D" },
  meloxicam: { name: "Meloxicam", rxcui: "41493", categories: ["nsaid"], pregnancyCategory: "D" },
  piroxicam: { name: "Piroxicam", rxcui: "8356", categories: ["nsaid"], pregnancyCategory: "D" },
  indomethacin: { name: "Indomethacin", rxcui: "5781", categories: ["nsaid"], pregnancyCategory: "D" },
  celecoxib: { name: "Celecoxib", rxcui: "140587", categories: ["nsaid"], pregnancyCategory: "D" },
  mefenamic: { name: "Mefenamic Acid", rxcui: "6750", categories: ["nsaid"], pregnancyCategory: "C" },
  "mefenamic acid": { name: "Mefenamic Acid", rxcui: "6750", categories: ["nsaid"], pregnancyCategory: "C" },

  // === ACE INHIBITORS ===
  lisinopril: { name: "Lisinopril", rxcui: "29046", categories: ["ace_inhibitor", "nephrotoxic"], pregnancyCategory: "D" },
  enalapril: { name: "Enalapril", rxcui: "3827", categories: ["ace_inhibitor", "nephrotoxic"], pregnancyCategory: "D" },
  ramipril: { name: "Ramipril", rxcui: "35296", categories: ["ace_inhibitor", "nephrotoxic"], pregnancyCategory: "D" },
  captopril: { name: "Captopril", rxcui: "1998", categories: ["ace_inhibitor", "nephrotoxic"], pregnancyCategory: "D" },
  perindopril: { name: "Perindopril", rxcui: "54552", categories: ["ace_inhibitor", "nephrotoxic"], pregnancyCategory: "D" },

  // === ARBs ===
  losartan: { name: "Losartan", rxcui: "52175", categories: ["arb", "nephrotoxic"], pregnancyCategory: "D" },
  valsartan: { name: "Valsartan", rxcui: "69749", categories: ["arb", "nephrotoxic"], pregnancyCategory: "D" },
  telmisartan: { name: "Telmisartan", rxcui: "73494", categories: ["arb", "nephrotoxic"], pregnancyCategory: "D" },
  olmesartan: { name: "Olmesartan", rxcui: "321064", categories: ["arb", "nephrotoxic"], pregnancyCategory: "D" },
  irbesartan: { name: "Irbesartan", rxcui: "83818", categories: ["arb", "nephrotoxic"], pregnancyCategory: "D" },

  // === DIURETICS ===
  furosemide: { name: "Furosemide", rxcui: "4603", categories: ["other"], pregnancyCategory: "C" },
  hydrochlorothiazide: { name: "Hydrochlorothiazide", rxcui: "5487", categories: ["other"], pregnancyCategory: "B" },
  spironolactone: { name: "Spironolactone", rxcui: "9997", categories: ["potassium_sparing_diuretic"], pregnancyCategory: "D" },
  amiloride: { name: "Amiloride", rxcui: "644", categories: ["potassium_sparing_diuretic"], pregnancyCategory: "B" },

  // === BETA BLOCKERS ===
  atenolol: { name: "Atenolol", rxcui: "1202", categories: ["beta_blocker"], pregnancyCategory: "D" },
  metoprolol: { name: "Metoprolol", rxcui: "6918", categories: ["beta_blocker"], pregnancyCategory: "C" },
  bisoprolol: { name: "Bisoprolol", rxcui: "19484", categories: ["beta_blocker"], pregnancyCategory: "C" },
  carvedilol: { name: "Carvedilol", rxcui: "20352", categories: ["beta_blocker"], pregnancyCategory: "C" },
  propranolol: { name: "Propranolol", rxcui: "8787", categories: ["beta_blocker"], pregnancyCategory: "C" },

  // === CALCIUM CHANNEL BLOCKERS ===
  amlodipine: { name: "Amlodipine", rxcui: "17767", categories: ["calcium_channel_blocker"], pregnancyCategory: "C" },
  nifedipine: { name: "Nifedipine", rxcui: "7417", categories: ["calcium_channel_blocker"], pregnancyCategory: "C" },
  diltiazem: { name: "Diltiazem", rxcui: "3443", categories: ["calcium_channel_blocker"], pregnancyCategory: "C" },
  verapamil: { name: "Verapamil", rxcui: "11170", categories: ["calcium_channel_blocker"], pregnancyCategory: "C" },

  // === STATINS ===
  atorvastatin: { name: "Atorvastatin", rxcui: "83367", categories: ["statin", "hepatotoxic"], pregnancyCategory: "X" },
  rosuvastatin: { name: "Rosuvastatin", rxcui: "301542", categories: ["statin", "hepatotoxic"], pregnancyCategory: "X" },
  simvastatin: { name: "Simvastatin", rxcui: "36567", categories: ["statin", "hepatotoxic"], pregnancyCategory: "X" },
  pravastatin: { name: "Pravastatin", rxcui: "42463", categories: ["statin", "hepatotoxic"], pregnancyCategory: "X" },

  // === FIBRATES ===
  fenofibrate: { name: "Fenofibrate", rxcui: "8703", categories: ["fibrate"], pregnancyCategory: "C" },
  gemfibrozil: { name: "Gemfibrozil", rxcui: "4719", categories: ["fibrate"], pregnancyCategory: "C" },

  // === DIABETES MEDICATIONS ===
  metformin: { name: "Metformin", rxcui: "6809", categories: ["antidiabetic"], pregnancyCategory: "B" },
  glimepiride: { name: "Glimepiride", rxcui: "25789", categories: ["sulfonylurea", "antidiabetic"], pregnancyCategory: "C" },
  glibenclamide: { name: "Glibenclamide", rxcui: "4815", categories: ["sulfonylurea", "antidiabetic"], pregnancyCategory: "C" },
  glyburide: { name: "Glyburide", rxcui: "4815", categories: ["sulfonylurea", "antidiabetic"], pregnancyCategory: "C" },
  gliclazide: { name: "Gliclazide", rxcui: "4816", categories: ["sulfonylurea", "antidiabetic"], pregnancyCategory: "C" },
  sitagliptin: { name: "Sitagliptin", rxcui: "593411", categories: ["antidiabetic"], pregnancyCategory: "B" },
  pioglitazone: { name: "Pioglitazone", rxcui: "33738", categories: ["antidiabetic"], pregnancyCategory: "C" },
  insulin: { name: "Insulin", rxcui: "5856", categories: ["insulin", "antidiabetic"], pregnancyCategory: "B" },
  "insulin glargine": { name: "Insulin Glargine", rxcui: "274783", categories: ["insulin", "antidiabetic"], pregnancyCategory: "C" },
  empagliflozin: { name: "Empagliflozin", rxcui: "1545653", categories: ["antidiabetic"], pregnancyCategory: "C" },
  dapagliflozin: { name: "Dapagliflozin", rxcui: "1488564", categories: ["antidiabetic"], pregnancyCategory: "C" },

  // === ANTIBIOTICS ===
  amoxicillin: { name: "Amoxicillin", rxcui: "723", categories: ["other"], pregnancyCategory: "B" },
  azithromycin: { name: "Azithromycin", rxcui: "18631", categories: ["antibiotic_macrolide", "qt_prolonging"], pregnancyCategory: "B" },
  clarithromycin: { name: "Clarithromycin", rxcui: "21212", categories: ["antibiotic_macrolide", "qt_prolonging"], pregnancyCategory: "C" },
  erythromycin: { name: "Erythromycin", rxcui: "4053", categories: ["antibiotic_macrolide", "qt_prolonging"], pregnancyCategory: "B" },
  ciprofloxacin: { name: "Ciprofloxacin", rxcui: "2551", categories: ["antibiotic_fluoroquinolone", "qt_prolonging"], pregnancyCategory: "C" },
  levofloxacin: { name: "Levofloxacin", rxcui: "82122", categories: ["antibiotic_fluoroquinolone", "qt_prolonging"], pregnancyCategory: "C" },
  moxifloxacin: { name: "Moxifloxacin", rxcui: "139462", categories: ["antibiotic_fluoroquinolone", "qt_prolonging"], pregnancyCategory: "C" },
  metronidazole: { name: "Metronidazole", rxcui: "6922", categories: ["other"], pregnancyCategory: "B" },
  doxycycline: { name: "Doxycycline", rxcui: "3640", categories: ["other", "teratogen"], pregnancyCategory: "D" },
  tetracycline: { name: "Tetracycline", rxcui: "10395", categories: ["other", "teratogen"], pregnancyCategory: "D" },
  cotrimoxazole: { name: "Cotrimoxazole", rxcui: "10831", categories: ["other"], pregnancyCategory: "D" },
  trimethoprim: { name: "Trimethoprim", rxcui: "10829", categories: ["other"], pregnancyCategory: "D" },

  // === ANTIFUNGALS ===
  fluconazole: { name: "Fluconazole", rxcui: "4450", categories: ["antifungal_azole", "qt_prolonging"], pregnancyCategory: "D" },
  itraconazole: { name: "Itraconazole", rxcui: "28031", categories: ["antifungal_azole"], pregnancyCategory: "C" },
  ketoconazole: { name: "Ketoconazole", rxcui: "6135", categories: ["antifungal_azole", "hepatotoxic"], pregnancyCategory: "C" },

  // === GI MEDICATIONS ===
  omeprazole: { name: "Omeprazole", rxcui: "7646", categories: ["ppi"], pregnancyCategory: "C" },
  esomeprazole: { name: "Esomeprazole", rxcui: "283742", categories: ["ppi"], pregnancyCategory: "C" },
  pantoprazole: { name: "Pantoprazole", rxcui: "40790", categories: ["ppi"], pregnancyCategory: "B" },
  lansoprazole: { name: "Lansoprazole", rxcui: "17128", categories: ["ppi"], pregnancyCategory: "B" },
  ranitidine: { name: "Ranitidine", rxcui: "9143", categories: ["h2_blocker"], pregnancyCategory: "B" },
  famotidine: { name: "Famotidine", rxcui: "4278", categories: ["h2_blocker"], pregnancyCategory: "B" },

  // === ANTIDEPRESSANTS ===
  sertraline: { name: "Sertraline", rxcui: "36437", categories: ["ssri", "serotonergic"], pregnancyCategory: "C" },
  escitalopram: { name: "Escitalopram", rxcui: "321988", categories: ["ssri", "serotonergic"], pregnancyCategory: "C" },
  fluoxetine: { name: "Fluoxetine", rxcui: "4493", categories: ["ssri", "serotonergic"], pregnancyCategory: "C" },
  paroxetine: { name: "Paroxetine", rxcui: "32937", categories: ["ssri", "serotonergic"], pregnancyCategory: "D" },
  citalopram: { name: "Citalopram", rxcui: "2556", categories: ["ssri", "serotonergic", "qt_prolonging"], pregnancyCategory: "C" },
  venlafaxine: { name: "Venlafaxine", rxcui: "39786", categories: ["snri", "serotonergic"], pregnancyCategory: "C" },
  duloxetine: { name: "Duloxetine", rxcui: "72625", categories: ["snri", "serotonergic"], pregnancyCategory: "C" },
  amitriptyline: { name: "Amitriptyline", rxcui: "704", categories: ["tca", "serotonergic", "qt_prolonging"], pregnancyCategory: "C" },
  nortriptyline: { name: "Nortriptyline", rxcui: "7531", categories: ["tca", "serotonergic"], pregnancyCategory: "D" },
  mirtazapine: { name: "Mirtazapine", rxcui: "15996", categories: ["serotonergic"], pregnancyCategory: "C" },
  trazodone: { name: "Trazodone", rxcui: "10737", categories: ["serotonergic"], pregnancyCategory: "C" },

  // === ANXIOLYTICS & SEDATIVES ===
  alprazolam: { name: "Alprazolam", rxcui: "596", categories: ["benzodiazepine", "cns_depressant"], pregnancyCategory: "D" },
  diazepam: { name: "Diazepam", rxcui: "3322", categories: ["benzodiazepine", "cns_depressant"], pregnancyCategory: "D" },
  lorazepam: { name: "Lorazepam", rxcui: "6470", categories: ["benzodiazepine", "cns_depressant"], pregnancyCategory: "D" },
  clonazepam: { name: "Clonazepam", rxcui: "2598", categories: ["benzodiazepine", "cns_depressant"], pregnancyCategory: "D" },
  zolpidem: { name: "Zolpidem", rxcui: "39993", categories: ["cns_depressant"], pregnancyCategory: "C" },

  // === OPIOIDS ===
  tramadol: { name: "Tramadol", rxcui: "10689", categories: ["opioid", "cns_depressant", "serotonergic"], pregnancyCategory: "C" },
  codeine: { name: "Codeine", rxcui: "2670", categories: ["opioid", "cns_depressant"], pregnancyCategory: "C" },
  morphine: { name: "Morphine", rxcui: "7052", categories: ["opioid", "cns_depressant"], pregnancyCategory: "C" },

  // === CARDIAC ===
  digoxin: { name: "Digoxin", rxcui: "3407", categories: ["digoxin"], pregnancyCategory: "C" },
  amiodarone: { name: "Amiodarone", rxcui: "703", categories: ["qt_prolonging"], pregnancyCategory: "D" },

  // === OTHERS ===
  isotretinoin: { name: "Isotretinoin", rxcui: "7592", categories: ["teratogen"], pregnancyCategory: "X" },
  methotrexate: { name: "Methotrexate", rxcui: "6851", categories: ["methotrexate", "teratogen", "hepatotoxic"], pregnancyCategory: "X" },
  lithium: { name: "Lithium", rxcui: "6448", categories: ["lithium", "nephrotoxic"], pregnancyCategory: "D" },
  allopurinol: { name: "Allopurinol", rxcui: "519", categories: ["other"], pregnancyCategory: "C" },
  colchicine: { name: "Colchicine", rxcui: "2683", categories: ["other"], pregnancyCategory: "C" },
  prednisone: { name: "Prednisone", rxcui: "8640", categories: ["other"], pregnancyCategory: "C" },
  prednisolone: { name: "Prednisolone", rxcui: "8638", categories: ["other"], pregnancyCategory: "C" },
  dexamethasone: { name: "Dexamethasone", rxcui: "3264", categories: ["other"], pregnancyCategory: "C" },
  levothyroxine: { name: "Levothyroxine", rxcui: "10582", categories: ["other"], pregnancyCategory: "A" },
  thyroxine: { name: "Levothyroxine", rxcui: "10582", categories: ["other"], pregnancyCategory: "A" },
  montelukast: { name: "Montelukast", rxcui: "88249", categories: ["other"], pregnancyCategory: "B" },
  cetirizine: { name: "Cetirizine", rxcui: "20610", categories: ["other"], pregnancyCategory: "B" },
  loratadine: { name: "Loratadine", rxcui: "28889", categories: ["other"], pregnancyCategory: "B" },
  fexofenadine: { name: "Fexofenadine", rxcui: "26225", categories: ["other"], pregnancyCategory: "C" },
  "potassium chloride": { name: "Potassium Chloride", rxcui: "8591", categories: ["potassium_supplement"], pregnancyCategory: "C" },
  potassium: { name: "Potassium Chloride", rxcui: "8591", categories: ["potassium_supplement"], pregnancyCategory: "C" },
  "k+": { name: "Potassium Chloride", rxcui: "8591", categories: ["potassium_supplement"], pregnancyCategory: "C" },
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

// Get extended drug info by rxcui (internal use)
const getExtendedDrug = (rxcui: string): ExtendedDrug | undefined => {
  return Object.values(RXNORM_MAP).find((d) => d.rxcui === rxcui);
};

export const normalizeDrugs = (meds: string[]): { normalized: NormalizedDrug[]; unknown: string[] } => {
  const normalized: NormalizedDrug[] = [];
  const unknown: string[] = [];

  for (const med of meds) {
    const key = normalizeKey(med);
    const match = RXNORM_MAP[key];
    if (match) {
      // Return only NormalizedDrug fields for external interface
      normalized.push({ name: match.name, rxcui: match.rxcui });
    } else {
      // Try partial matching for brand names
      const partialMatch = Object.entries(RXNORM_MAP).find(([k]) =>
        key.includes(k) || k.includes(key)
      );
      if (partialMatch) {
        const drug = partialMatch[1];
        normalized.push({ name: drug.name, rxcui: drug.rxcui });
      } else {
        unknown.push(med);
      }
    }
  }

  return { normalized, unknown };
};

// === DRUG INTERACTION PAIRS (25+ critical interactions) ===
const interactionPairs: Array<{
  rxcuis: [string, string];
  severity: RxIssue["severity"];
  mechanism: string;
  management: string;
}> = [
  // ANTICOAGULANT + ANTIPLATELET/NSAID INTERACTIONS (Bleeding Risk)
  {
    rxcuis: ["11289", "1191"], // Warfarin + Aspirin
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_warfarin_aspirin",
    management: "Critical bleeding risk. Consult prescriber immediately; INR monitoring essential.",
  },
  {
    rxcuis: ["11289", "5640"], // Warfarin + Ibuprofen
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_warfarin_nsaid",
    management: "Significant bleeding risk. Avoid NSAIDs with warfarin; use paracetamol for pain.",
  },
  {
    rxcuis: ["11289", "7258"], // Warfarin + Naproxen
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_warfarin_nsaid",
    management: "Significant bleeding risk. Avoid NSAIDs with warfarin; use paracetamol for pain.",
  },
  {
    rxcuis: ["11289", "3355"], // Warfarin + Diclofenac
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_warfarin_nsaid",
    management: "Significant bleeding risk. Avoid NSAIDs with warfarin; use paracetamol for pain.",
  },
  {
    rxcuis: ["32968", "1191"], // Clopidogrel + Aspirin
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_dual_antiplatelet",
    management: "Dual antiplatelet therapy increases bleeding risk. Only use if prescribed together intentionally.",
  },
  {
    rxcuis: ["32968", "7646"], // Clopidogrel + Omeprazole
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_clopidogrel_ppi",
    management: "Omeprazole may reduce clopidogrel effectiveness. Consider pantoprazole as alternative PPI.",
  },

  // ACE-I/ARB + POTASSIUM INTERACTIONS (Hyperkalemia Risk)
  {
    rxcuis: ["29046", "8591"], // Lisinopril + Potassium
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_acei_potassium",
    management: "Risk of hyperkalemia (high potassium). Monitor potassium levels regularly.",
  },
  {
    rxcuis: ["29046", "9997"], // Lisinopril + Spironolactone
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_acei_k_sparing",
    management: "Combined use increases hyperkalemia risk. Monitor potassium and renal function.",
  },
  {
    rxcuis: ["52175", "8591"], // Losartan + Potassium
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_arb_potassium",
    management: "Risk of hyperkalemia. Monitor potassium levels; avoid potassium supplements unless directed.",
  },
  {
    rxcuis: ["52175", "9997"], // Losartan + Spironolactone
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_arb_k_sparing",
    management: "Combined use increases hyperkalemia risk. Monitor potassium and renal function closely.",
  },

  // STATIN INTERACTIONS (Myopathy/Rhabdomyolysis Risk)
  {
    rxcuis: ["36567", "4719"], // Simvastatin + Gemfibrozil
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_statin_fibrate",
    management: "High risk of rhabdomyolysis. This combination should generally be avoided.",
  },
  {
    rxcuis: ["83367", "21212"], // Atorvastatin + Clarithromycin
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_statin_macrolide",
    management: "Increased statin levels and myopathy risk. Consider temporary statin pause during antibiotic.",
  },
  {
    rxcuis: ["36567", "4450"], // Simvastatin + Fluconazole
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_statin_azole",
    management: "Increased statin levels. Consider dose reduction or temporary pause.",
  },

  // SEROTONIN SYNDROME RISK
  {
    rxcuis: ["10689", "36437"], // Tramadol + Sertraline
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_serotonin_syndrome",
    management: "Risk of serotonin syndrome. Watch for agitation, confusion, rapid heart rate, fever.",
  },
  {
    rxcuis: ["10689", "4493"], // Tramadol + Fluoxetine
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_serotonin_syndrome",
    management: "Risk of serotonin syndrome. Monitor closely; consider alternative pain relief.",
  },
  {
    rxcuis: ["36437", "704"], // Sertraline + Amitriptyline
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_ssri_tca",
    management: "Risk of serotonin syndrome and increased TCA levels. Use with caution.",
  },

  // CNS DEPRESSION RISK
  {
    rxcuis: ["596", "10689"], // Alprazolam + Tramadol
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_benzo_opioid",
    management: "Critical: Combined CNS depression increases overdose risk. Avoid if possible.",
  },
  {
    rxcuis: ["3322", "7052"], // Diazepam + Morphine
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_benzo_opioid",
    management: "Critical: Combined CNS depression can be fatal. Requires close medical supervision.",
  },
  {
    rxcuis: ["596", "39993"], // Alprazolam + Zolpidem
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_cns_depressants",
    management: "Excessive sedation risk. Do not take together without medical supervision.",
  },

  // LITHIUM INTERACTIONS
  {
    rxcuis: ["6448", "5640"], // Lithium + Ibuprofen
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_lithium_nsaid",
    management: "NSAIDs increase lithium levels. Monitor lithium closely; use paracetamol instead.",
  },
  {
    rxcuis: ["6448", "29046"], // Lithium + Lisinopril
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_lithium_acei",
    management: "ACE inhibitors increase lithium levels. Requires frequent lithium monitoring.",
  },

  // DIGOXIN INTERACTIONS
  {
    rxcuis: ["3407", "703"], // Digoxin + Amiodarone
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_digoxin_amiodarone",
    management: "Amiodarone increases digoxin levels. Digoxin dose typically needs 50% reduction.",
  },
  {
    rxcuis: ["3407", "11170"], // Digoxin + Verapamil
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_digoxin_ccb",
    management: "Verapamil increases digoxin levels. Monitor digoxin levels and heart rate.",
  },

  // QT PROLONGATION RISK
  {
    rxcuis: ["703", "18631"], // Amiodarone + Azithromycin
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_qt_prolonging",
    management: "Both drugs prolong QT interval. High risk of dangerous arrhythmias. Avoid combination.",
  },
  {
    rxcuis: ["2556", "139462"], // Citalopram + Moxifloxacin
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_qt_prolonging",
    management: "Both drugs prolong QT interval. ECG monitoring recommended; consider alternatives.",
  },

  // METHOTREXATE INTERACTIONS
  {
    rxcuis: ["6851", "5640"], // Methotrexate + Ibuprofen
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_mtx_nsaid",
    management: "NSAIDs reduce methotrexate clearance, increasing toxicity risk. Avoid NSAIDs.",
  },
  {
    rxcuis: ["6851", "10831"], // Methotrexate + Cotrimoxazole
    severity: "critical",
    mechanism: "DeterministicEngine:interaction_mtx_folate_antagonist",
    management: "Both are folate antagonists. Severe bone marrow suppression risk. Avoid combination.",
  },

  // DIABETES INTERACTIONS
  {
    rxcuis: ["4815", "2551"], // Glyburide + Ciprofloxacin
    severity: "serious",
    mechanism: "DeterministicEngine:interaction_sulfonylurea_fluoroquinolone",
    management: "Risk of severe hypoglycemia. Monitor blood sugar closely; may need dose adjustment.",
  },
];

const containsPair = (rxcuis: string[], pair: [string, string]) => {
  return rxcuis.includes(pair[0]) && rxcuis.includes(pair[1]);
};

// Check for category-based interactions (uses internal extended drug lookup)
const checkCategoryInteractions = (
  normalized: NormalizedDrug[],
): RxIssue[] => {
  const issues: RxIssue[] = [];

  // Get extended info for all drugs
  const extendedDrugs = normalized
    .map((d) => ({ base: d, extended: getExtendedDrug(d.rxcui) }))
    .filter((d) => d.extended !== undefined) as Array<{ base: NormalizedDrug; extended: ExtendedDrug }>;

  // Multiple NSAIDs
  const nsaids = extendedDrugs.filter((d) => d.extended.categories.includes("nsaid"));
  if (nsaids.length > 1) {
    issues.push({
      type: "interaction",
      severity: "serious",
      normalized_drugs: nsaids.map((d) => d.base),
      mechanism: "DeterministicEngine:multiple_nsaids",
      management: "Multiple NSAIDs increase GI bleeding and kidney injury risk. Use only one NSAID.",
      evidence_source: "DrugEngine:v2",
    });
  }

  // Multiple serotonergic drugs
  const serotonergic = extendedDrugs.filter((d) => d.extended.categories.includes("serotonergic"));
  if (serotonergic.length > 1) {
    issues.push({
      type: "interaction",
      severity: "serious",
      normalized_drugs: serotonergic.map((d) => d.base),
      mechanism: "DeterministicEngine:serotonin_syndrome_risk",
      management: "Multiple serotonergic drugs increase risk of serotonin syndrome. Monitor for symptoms.",
      evidence_source: "DrugEngine:v2",
    });
  }

  // Multiple QT-prolonging drugs
  const qtProlonging = extendedDrugs.filter((d) => d.extended.categories.includes("qt_prolonging"));
  if (qtProlonging.length > 1) {
    issues.push({
      type: "interaction",
      severity: "serious",
      normalized_drugs: qtProlonging.map((d) => d.base),
      mechanism: "DeterministicEngine:qt_prolongation_risk",
      management: "Multiple QT-prolonging drugs increase arrhythmia risk. ECG monitoring recommended.",
      evidence_source: "DrugEngine:v2",
    });
  }

  // Multiple CNS depressants
  const cnsDepressants = extendedDrugs.filter((d) => d.extended.categories.includes("cns_depressant"));
  if (cnsDepressants.length > 1) {
    issues.push({
      type: "interaction",
      severity: "serious",
      normalized_drugs: cnsDepressants.map((d) => d.base),
      mechanism: "DeterministicEngine:cns_depression_risk",
      management: "Multiple CNS depressants increase sedation and respiratory depression risk.",
      evidence_source: "DrugEngine:v2",
    });
  }

  return issues;
};

// Pregnancy contraindications - comprehensive check (uses internal extended drug lookup)
const checkPregnancyContraindications = (
  normalized: NormalizedDrug[],
): RxIssue[] => {
  const issues: RxIssue[] = [];
  const flaggedRxcuis = new Set<string>();

  // Get extended info for all drugs
  const extendedDrugs = normalized
    .map((d) => ({ base: d, extended: getExtendedDrug(d.rxcui) }))
    .filter((d) => d.extended !== undefined) as Array<{ base: NormalizedDrug; extended: ExtendedDrug }>;

  // Check Category X drugs (absolute contraindication)
  const categoryX = extendedDrugs.filter((d) => d.extended.pregnancyCategory === "X");
  for (const drug of categoryX) {
    flaggedRxcuis.add(drug.base.rxcui);
    issues.push({
      type: "contraindication",
      severity: "critical",
      normalized_drugs: [drug.base],
      mechanism: "DeterministicEngine:pregnancy_category_x",
      management: `${drug.base.name} is Category X - CONTRAINDICATED in pregnancy. Known to cause fetal harm. Seek urgent clinician guidance.`,
      evidence_source: "DrugEngine:v2",
    });
  }

  // Check Category D drugs (evidence of risk)
  const categoryD = extendedDrugs.filter(
    (d) => d.extended.pregnancyCategory === "D" && !flaggedRxcuis.has(d.base.rxcui)
  );
  for (const drug of categoryD) {
    flaggedRxcuis.add(drug.base.rxcui);
    issues.push({
      type: "contraindication",
      severity: "serious",
      normalized_drugs: [drug.base],
      mechanism: "DeterministicEngine:pregnancy_category_d",
      management: `${drug.base.name} is Category D - Evidence of fetal risk. Discuss alternatives with your doctor urgently.`,
      evidence_source: "DrugEngine:v2",
    });
  }

  // Check specific high-risk categories
  const aceInhibitors = extendedDrugs.filter(
    (d) => d.extended.categories.includes("ace_inhibitor") && !flaggedRxcuis.has(d.base.rxcui)
  );
  for (const drug of aceInhibitors) {
    flaggedRxcuis.add(drug.base.rxcui);
    issues.push({
      type: "contraindication",
      severity: "critical",
      normalized_drugs: [drug.base],
      mechanism: "DeterministicEngine:pregnancy_acei_contraindication",
      management: `${drug.base.name} (ACE inhibitor) can cause serious fetal kidney damage and other birth defects. Must be stopped in pregnancy.`,
      evidence_source: "DrugEngine:v2",
    });
  }

  const arbs = extendedDrugs.filter(
    (d) => d.extended.categories.includes("arb") && !flaggedRxcuis.has(d.base.rxcui)
  );
  for (const drug of arbs) {
    flaggedRxcuis.add(drug.base.rxcui);
    issues.push({
      type: "contraindication",
      severity: "critical",
      normalized_drugs: [drug.base],
      mechanism: "DeterministicEngine:pregnancy_arb_contraindication",
      management: `${drug.base.name} (ARB) can cause serious fetal harm including kidney damage. Must be stopped in pregnancy.`,
      evidence_source: "DrugEngine:v2",
    });
  }

  const statins = extendedDrugs.filter(
    (d) => d.extended.categories.includes("statin") && !flaggedRxcuis.has(d.base.rxcui)
  );
  for (const drug of statins) {
    flaggedRxcuis.add(drug.base.rxcui);
    issues.push({
      type: "contraindication",
      severity: "critical",
      normalized_drugs: [drug.base],
      mechanism: "DeterministicEngine:pregnancy_statin_contraindication",
      management: `${drug.base.name} (statin) is contraindicated in pregnancy. Stop immediately and consult your doctor.`,
      evidence_source: "DrugEngine:v2",
    });
  }

  // NSAIDs in pregnancy
  const nsaids = extendedDrugs.filter(
    (d) => d.extended.categories.includes("nsaid") && !flaggedRxcuis.has(d.base.rxcui)
  );
  for (const drug of nsaids) {
    flaggedRxcuis.add(drug.base.rxcui);
    issues.push({
      type: "contraindication",
      severity: "serious",
      normalized_drugs: [drug.base],
      mechanism: "DeterministicEngine:pregnancy_nsaid_warning",
      management: `${drug.base.name} (NSAID) should be avoided in pregnancy, especially after 20 weeks. Can affect fetal kidneys and heart.`,
      evidence_source: "DrugEngine:v2",
    });
  }

  return issues;
};

export const checkInteractions = (
  input: PrescriptionInput,
  normalized: NormalizedDrug[],
): RxIssue[] => {
  const issues: RxIssue[] = [];
  const rxcuis = normalized.map((drug) => drug.rxcui);

  // Check specific interaction pairs
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
        evidence_source: "DrugEngine:v2",
      });
    }
  }

  // Check category-based interactions
  issues.push(...checkCategoryInteractions(normalized));

  // Check for duplications (improved: check all occurrences)
  const drugCounts = new Map<string, NormalizedDrug[]>();
  for (const drug of normalized) {
    const existing = drugCounts.get(drug.rxcui) ?? [];
    existing.push(drug);
    drugCounts.set(drug.rxcui, existing);
  }
  for (const [, drugs] of drugCounts) {
    if (drugs.length > 1) {
      issues.push({
        type: "duplication",
        severity: "caution",
        normalized_drugs: [drugs[0]],
        mechanism: "DeterministicEngine:duplication",
        management: "Confirm if duplicate therapy is intentional with prescriber.",
        evidence_source: "DrugEngine:v2",
      });
    }
  }

  // Check pregnancy contraindications
  if (input.pregnant) {
    issues.push(...checkPregnancyContraindications(normalized));
  }

  return issues;
};
