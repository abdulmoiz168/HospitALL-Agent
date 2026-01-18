import { Patient, PatientSchema } from "../schemas/patient";

// Rukhsana Bibi - 68F with Diabetes, Hypertension, Chronic Kidney Disease
const rukhsanaBibi: Patient = {
  demographics: {
    id: "patient_001",
    firstName: "Rukhsana",
    lastName: "Bibi",
    dateOfBirth: "1957-03-15",
    sex: "female",
    contact: {
      phone: "0321-4567890",
      email: "rukhsana.bibi@email.com",
      address: "House 45, Block D, Johar Town, Lahore",
      emergencyContact: {
        name: "Kashif Mahmood",
        relationship: "Son",
        phone: "0300-1234567",
      },
    },
  },
  conditions: [
    {
      name: "Type 2 Diabetes Mellitus",
      status: "chronic",
      diagnosedDate: "2010-06-20",
      notes: "Insulin-dependent since 2018",
    },
    {
      name: "Essential Hypertension",
      status: "chronic",
      diagnosedDate: "2008-02-14",
      notes: "Well-controlled on current medication regimen",
    },
    {
      name: "Chronic Kidney Disease Stage 3a",
      status: "chronic",
      diagnosedDate: "2020-11-03",
      notes: "eGFR 52 mL/min/1.73m2, secondary to diabetes and hypertension",
    },
    {
      name: "Diabetic Retinopathy",
      status: "active",
      diagnosedDate: "2019-08-22",
      notes: "Mild non-proliferative, annual ophthalmology follow-up",
    },
  ],
  medications: [
    {
      name: "Metformin",
      dosage: "1000mg",
      frequency: "Twice daily with meals",
      status: "active",
      prescribedDate: "2010-07-01",
      prescribedBy: "Dr. Bilal Ahmad",
    },
    {
      name: "Insulin Glargine (Lantus)",
      dosage: "24 units",
      frequency: "Once daily at bedtime",
      status: "active",
      prescribedDate: "2018-03-15",
      prescribedBy: "Dr. Bilal Ahmad",
    },
    {
      name: "Lisinopril",
      dosage: "20mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2008-03-01",
      prescribedBy: "Dr. Ayesha Khan",
    },
    {
      name: "Amlodipine",
      dosage: "5mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2015-09-10",
      prescribedBy: "Dr. Ayesha Khan",
    },
    {
      name: "Atorvastatin",
      dosage: "40mg",
      frequency: "Once daily at bedtime",
      status: "active",
      prescribedDate: "2012-01-20",
      prescribedBy: "Dr. Ayesha Khan",
    },
  ],
  allergies: [
    {
      allergen: "Sulfa Drugs",
      severity: "severe",
      reaction: "Anaphylaxis, difficulty breathing, facial swelling",
      onsetDate: "1985-04-12",
    },
    {
      allergen: "Shellfish",
      severity: "moderate",
      reaction: "Hives, itching, gastrointestinal upset",
      onsetDate: "1992-08-20",
    },
  ],
  labResults: [
    {
      test: "HbA1c",
      value: "7.8",
      unit: "%",
      referenceRange: "< 7.0",
      date: "2025-01-05",
      status: "abnormal_high",
      notes: "Slightly elevated, discuss lifestyle modifications",
    },
    {
      test: "Fasting Blood Glucose",
      value: "142",
      unit: "mg/dL",
      referenceRange: "70-100",
      date: "2025-01-05",
      status: "abnormal_high",
    },
    {
      test: "Serum Creatinine",
      value: "1.4",
      unit: "mg/dL",
      referenceRange: "0.6-1.1",
      date: "2025-01-05",
      status: "abnormal_high",
    },
    {
      test: "eGFR",
      value: "52",
      unit: "mL/min/1.73m2",
      referenceRange: "> 90",
      date: "2025-01-05",
      status: "abnormal_low",
      notes: "CKD Stage 3a, stable from previous",
    },
    {
      test: "Blood Pressure",
      value: "138/82",
      unit: "mmHg",
      referenceRange: "< 130/80",
      date: "2025-01-10",
      status: "abnormal_high",
    },
    {
      test: "LDL Cholesterol",
      value: "95",
      unit: "mg/dL",
      referenceRange: "< 100",
      date: "2025-01-05",
      status: "normal",
    },
    {
      test: "Potassium",
      value: "4.8",
      unit: "mEq/L",
      referenceRange: "3.5-5.0",
      date: "2025-01-05",
      status: "normal",
    },
  ],
  visits: [
    {
      type: "follow_up",
      date: "2025-01-10",
      doctor: "Dr. Ayesha Khan",
      specialty: "Internal Medicine",
      summary:
        "Quarterly diabetes and hypertension follow-up. Blood pressure slightly elevated. HbA1c improved from 8.1 to 7.8. Discussed dietary modifications and increasing physical activity. Continue current medications.",
      followUpRequired: true,
    },
    {
      type: "specialist",
      date: "2024-11-15",
      doctor: "Dr. Zainab Shah",
      specialty: "Nephrology",
      summary:
        "CKD monitoring visit. Kidney function stable at Stage 3a. Recommended continuing ACE inhibitor and avoiding NSAIDs. Repeat labs in 3 months.",
      followUpRequired: true,
    },
    {
      type: "specialist",
      date: "2024-08-22",
      doctor: "Dr. Hassan Nawaz",
      specialty: "Ophthalmology",
      summary:
        "Annual diabetic eye exam. Mild non-proliferative diabetic retinopathy unchanged. No treatment needed. Return in 12 months.",
      followUpRequired: true,
    },
  ],
  insuranceProvider: "State Life Insurance",
  primaryCarePhysician: "Dr. Ayesha Khan",
};

// Farhan Ahmed - 45M with Heart Disease, High Cholesterol
const farhanAhmed: Patient = {
  demographics: {
    id: "patient_002",
    firstName: "Farhan",
    lastName: "Ahmed",
    dateOfBirth: "1980-09-22",
    sex: "male",
    contact: {
      phone: "0333-8765432",
      email: "farhan.ahmed@email.com",
      address: "House 123, Street 5, DHA Phase 5, Lahore",
      emergencyContact: {
        name: "Saima Ahmed",
        relationship: "Wife",
        phone: "0333-1234567",
      },
    },
  },
  conditions: [
    {
      name: "Coronary Artery Disease",
      status: "chronic",
      diagnosedDate: "2022-04-15",
      notes:
        "Two-vessel disease, treated with PCI and stent placement in LAD artery",
    },
    {
      name: "Hyperlipidemia",
      status: "chronic",
      diagnosedDate: "2018-03-10",
      notes: "Familial component, requires high-intensity statin therapy",
    },
    {
      name: "History of Myocardial Infarction",
      status: "resolved",
      diagnosedDate: "2022-04-12",
      notes: "NSTEMI, treated with emergency PCI",
    },
    {
      name: "Anxiety Disorder",
      status: "active",
      diagnosedDate: "2022-06-01",
      notes: "Post-MI anxiety, managed with therapy and medication",
    },
  ],
  medications: [
    {
      name: "Aspirin",
      dosage: "81mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2022-04-20",
      prescribedBy: "Dr. Ahmed Raza",
    },
    {
      name: "Clopidogrel (Plavix)",
      dosage: "75mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2022-04-20",
      prescribedBy: "Dr. Ahmed Raza",
    },
    {
      name: "Rosuvastatin (Crestor)",
      dosage: "40mg",
      frequency: "Once daily at bedtime",
      status: "active",
      prescribedDate: "2022-04-20",
      prescribedBy: "Dr. Ahmed Raza",
    },
    {
      name: "Metoprolol Succinate",
      dosage: "50mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2022-04-20",
      prescribedBy: "Dr. Ahmed Raza",
    },
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2022-04-20",
      prescribedBy: "Dr. Ahmed Raza",
    },
    {
      name: "Sertraline (Zoloft)",
      dosage: "50mg",
      frequency: "Once daily in morning",
      status: "active",
      prescribedDate: "2022-07-15",
      prescribedBy: "Dr. Asma Rizvi",
    },
    {
      name: "Nitroglycerin SL",
      dosage: "0.4mg",
      frequency: "As needed for chest pain",
      status: "as_needed",
      prescribedDate: "2022-04-20",
      prescribedBy: "Dr. Ahmed Raza",
    },
  ],
  allergies: [
    {
      allergen: "Penicillin",
      severity: "moderate",
      reaction: "Skin rash, hives",
      onsetDate: "1995-06-15",
    },
  ],
  labResults: [
    {
      test: "Total Cholesterol",
      value: "178",
      unit: "mg/dL",
      referenceRange: "< 200",
      date: "2025-01-08",
      status: "normal",
    },
    {
      test: "LDL Cholesterol",
      value: "68",
      unit: "mg/dL",
      referenceRange: "< 70 (for CAD)",
      date: "2025-01-08",
      status: "normal",
      notes: "At goal for secondary prevention",
    },
    {
      test: "HDL Cholesterol",
      value: "52",
      unit: "mg/dL",
      referenceRange: "> 40",
      date: "2025-01-08",
      status: "normal",
    },
    {
      test: "Triglycerides",
      value: "145",
      unit: "mg/dL",
      referenceRange: "< 150",
      date: "2025-01-08",
      status: "normal",
    },
    {
      test: "BNP",
      value: "45",
      unit: "pg/mL",
      referenceRange: "< 100",
      date: "2025-01-08",
      status: "normal",
    },
    {
      test: "Troponin I",
      value: "< 0.01",
      unit: "ng/mL",
      referenceRange: "< 0.04",
      date: "2025-01-08",
      status: "normal",
    },
    {
      test: "Blood Pressure",
      value: "124/78",
      unit: "mmHg",
      referenceRange: "< 130/80",
      date: "2025-01-12",
      status: "normal",
    },
  ],
  visits: [
    {
      type: "follow_up",
      date: "2025-01-12",
      doctor: "Dr. Ahmed Raza",
      specialty: "Cardiology",
      summary:
        "Post-MI follow-up. Patient reports no chest pain or shortness of breath. Tolerating cardiac rehab well. Exercise stress test showed good functional capacity. Continue current medications. DAPT for 12 months total.",
      followUpRequired: true,
    },
    {
      type: "procedure",
      date: "2024-10-05",
      doctor: "Dr. Ahmed Raza",
      specialty: "Cardiology",
      summary:
        "Cardiac stress echocardiogram. No inducible ischemia. EF 55-60%. Mild diastolic dysfunction. Continue current management.",
      followUpRequired: false,
    },
    {
      type: "telemedicine",
      date: "2024-08-15",
      doctor: "Dr. Asma Rizvi",
      specialty: "Psychiatry",
      summary:
        "Anxiety management follow-up. Patient reports improved symptoms with sertraline. Continuing cognitive behavioral therapy. Sleep has improved. Maintain current dose.",
      followUpRequired: true,
    },
  ],
  insuranceProvider: "EFU Life Insurance",
  primaryCarePhysician: "Dr. Usman Malik",
};

// Amina Tariq - 32F with Pregnancy, Gestational Diabetes
const aminaTariq: Patient = {
  demographics: {
    id: "patient_003",
    firstName: "Amina",
    lastName: "Tariq",
    dateOfBirth: "1993-07-08",
    sex: "female",
    contact: {
      phone: "0345-6789012",
      email: "amina.tariq@email.com",
      address: "Flat 8, Al-Rehman Garden, Lahore",
      emergencyContact: {
        name: "Salman Tariq",
        relationship: "Husband",
        phone: "0345-0001234",
      },
    },
  },
  conditions: [
    {
      name: "Pregnancy",
      status: "active",
      diagnosedDate: "2024-08-15",
      notes: "G1P0 at 28 weeks gestation, EDD March 22, 2025",
    },
    {
      name: "Gestational Diabetes Mellitus",
      status: "active",
      diagnosedDate: "2024-12-01",
      notes:
        "Diagnosed at 24 weeks via OGTT, currently diet-controlled with good glucose readings",
    },
    {
      name: "Mild Anemia of Pregnancy",
      status: "active",
      diagnosedDate: "2024-11-15",
      notes: "Iron deficiency anemia, on supplementation",
    },
    {
      name: "History of Polycystic Ovary Syndrome",
      status: "in_remission",
      diagnosedDate: "2018-05-20",
      notes: "Previously managed with oral contraceptives, now pregnant",
    },
  ],
  medications: [
    {
      name: "Prenatal Vitamins",
      dosage: "1 tablet",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2024-08-20",
      prescribedBy: "Dr. Mariam Butt",
    },
    {
      name: "Ferrous Sulfate",
      dosage: "325mg",
      frequency: "Once daily with vitamin C",
      status: "active",
      prescribedDate: "2024-11-20",
      prescribedBy: "Dr. Mariam Butt",
    },
    {
      name: "Folic Acid",
      dosage: "400mcg",
      frequency: "Once daily",
      status: "active",
      prescribedDate: "2024-06-01",
      prescribedBy: "Dr. Mariam Butt",
    },
    {
      name: "Docusate Sodium",
      dosage: "100mg",
      frequency: "Twice daily as needed",
      status: "as_needed",
      prescribedDate: "2024-10-15",
      prescribedBy: "Dr. Mariam Butt",
    },
  ],
  allergies: [
    {
      allergen: "Latex",
      severity: "moderate",
      reaction: "Contact dermatitis, skin irritation",
      onsetDate: "2015-03-10",
    },
    {
      allergen: "Codeine",
      severity: "mild",
      reaction: "Nausea and vomiting",
      onsetDate: "2019-12-05",
    },
  ],
  labResults: [
    {
      test: "Fasting Blood Glucose",
      value: "92",
      unit: "mg/dL",
      referenceRange: "< 95 (pregnancy)",
      date: "2025-01-15",
      status: "normal",
    },
    {
      test: "2-Hour Postprandial Glucose",
      value: "118",
      unit: "mg/dL",
      referenceRange: "< 120 (pregnancy)",
      date: "2025-01-15",
      status: "normal",
    },
    {
      test: "Hemoglobin",
      value: "11.2",
      unit: "g/dL",
      referenceRange: "11.0-14.0 (pregnancy)",
      date: "2025-01-10",
      status: "normal",
      notes: "Improved from 10.2, iron supplementation effective",
    },
    {
      test: "Hematocrit",
      value: "34",
      unit: "%",
      referenceRange: "33-40 (pregnancy)",
      date: "2025-01-10",
      status: "normal",
    },
    {
      test: "Blood Pressure",
      value: "118/72",
      unit: "mmHg",
      referenceRange: "< 140/90",
      date: "2025-01-15",
      status: "normal",
    },
    {
      test: "Urine Protein",
      value: "Negative",
      unit: "",
      referenceRange: "Negative",
      date: "2025-01-15",
      status: "normal",
    },
    {
      test: "Group B Strep Screen",
      value: "Pending",
      unit: "",
      referenceRange: "Negative preferred",
      date: "2025-01-15",
      notes: "Results expected in 2-3 days",
    },
  ],
  visits: [
    {
      type: "routine_checkup",
      date: "2025-01-15",
      doctor: "Dr. Mariam Butt",
      specialty: "OB/GYN",
      summary:
        "28-week prenatal visit. Fetal growth appropriate for gestational age. Fetal heart tones 145 bpm. Fundal height 28cm. GDM well-controlled with diet. Started GBS screening. Discussed birth plan and third trimester expectations.",
      followUpRequired: true,
    },
    {
      type: "imaging",
      date: "2024-12-20",
      doctor: "Dr. Mariam Butt",
      specialty: "OB/GYN",
      summary:
        "Anatomy ultrasound at 24 weeks. Normal fetal anatomy. EFW at 55th percentile. Anterior placenta, adequate amniotic fluid. No abnormalities detected.",
      followUpRequired: false,
    },
    {
      type: "specialist",
      date: "2024-12-05",
      doctor: "Dr. Bilal Ahmad",
      specialty: "Endocrinology",
      summary:
        "GDM education and management consultation. Reviewed glucose monitoring protocol and dietary modifications. No insulin needed at this time. Follow up if glucose targets not met with diet alone.",
      followUpRequired: true,
    },
    {
      type: "lab_work",
      date: "2024-12-01",
      doctor: "Dr. Mariam Butt",
      specialty: "OB/GYN",
      summary:
        "Oral glucose tolerance test performed. Results: Fasting 98, 1-hour 195, 2-hour 162. Diagnostic for gestational diabetes. Referral to MFM and nutrition.",
      followUpRequired: true,
    },
  ],
  insuranceProvider: "Jubilee Life Insurance",
  primaryCarePhysician: "Dr. Khadija Ali",
};

// Export all mock patients
export const MOCK_PATIENTS: Patient[] = [rukhsanaBibi, farhanAhmed, aminaTariq];

// Validate all patients against schema
MOCK_PATIENTS.forEach((patient, index) => {
  const result = PatientSchema.safeParse(patient);
  if (!result.success) {
    console.error(
      `Patient validation failed for index ${index}:`,
      result.error
    );
  }
});

// Export individual patients for direct access
export { rukhsanaBibi, farhanAhmed, aminaTariq };
