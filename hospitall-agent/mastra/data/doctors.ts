import { Doctor, DoctorSchema } from "../schemas/doctor";

// Internal Medicine (2)
const drAyeshaKhan: Doctor = {
  id: "doctor_001",
  firstName: "Ayesha",
  lastName: "Khan",
  credentials: ["MBBS", "FCPS"],
  specialty: "internal_medicine",
  subSpecialties: ["Geriatric Medicine", "Preventive Care"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "15:00" },
  ],
  rating: 4.8,
  reviewCount: 342,
  bio: "Dr. Ayesha Khan is a board-certified internist with over 20 years of experience in primary care and chronic disease management. She specializes in caring for patients with multiple comorbidities and has a particular interest in preventive medicine and geriatric care.",
  imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Shaukat Khanum Memorial Hospital", "Doctors Hospital Lahore"],
  yearsOfExperience: 22,
};

const drUsmanMalik: Doctor = {
  id: "doctor_002",
  firstName: "Usman",
  lastName: "Malik",
  credentials: ["MBBS", "MRCP"],
  specialty: "internal_medicine",
  subSpecialties: ["Hospital Medicine", "Infectious Disease"],
  availability: [
    { dayOfWeek: "monday", startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: "tuesday", startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: "thursday", startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: "friday", startTime: "09:00", endTime: "16:00" },
  ],
  rating: 4.6,
  reviewCount: 218,
  bio: "Dr. Usman Malik combines his clinical expertise with a public health background to provide comprehensive internal medicine care. He has extensive experience in managing complex medical conditions and coordinates care for hospitalized patients.",
  imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Services Hospital Lahore"],
  yearsOfExperience: 15,
};

// Cardiology (2)
const drAhmedRaza: Doctor = {
  id: "doctor_003",
  firstName: "Ahmed",
  lastName: "Raza",
  credentials: ["MBBS", "FCPS", "FACC"],
  specialty: "cardiology",
  subSpecialties: ["Interventional Cardiology", "Structural Heart Disease"],
  availability: [
    { dayOfWeek: "monday", startTime: "07:00", endTime: "16:00" },
    { dayOfWeek: "tuesday", startTime: "07:00", endTime: "16:00" },
    { dayOfWeek: "wednesday", startTime: "07:00", endTime: "16:00" },
    { dayOfWeek: "thursday", startTime: "07:00", endTime: "12:00" },
  ],
  rating: 4.9,
  reviewCount: 456,
  bio: "Dr. Ahmed Raza is a fellowship-trained interventional cardiologist specializing in complex coronary interventions, structural heart procedures, and cardiac catheterization. He has performed over 3,000 cardiac procedures and is recognized for his expertise in treating acute coronary syndromes.",
  imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Punjab Institute of Cardiology", "Doctors Hospital Lahore"],
  yearsOfExperience: 18,
};

const drFatimaHussain: Doctor = {
  id: "doctor_004",
  firstName: "Fatima",
  lastName: "Hussain",
  credentials: ["MBBS", "FCPS"],
  specialty: "cardiology",
  subSpecialties: ["Heart Failure", "Cardiac Imaging"],
  availability: [
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "14:00" },
  ],
  rating: 4.7,
  reviewCount: 289,
  bio: "Dr. Fatima Hussain is an expert in heart failure management and advanced cardiac imaging. She leads the heart failure clinic and specializes in helping patients optimize their cardiac function through medical therapy, lifestyle modifications, and device therapy when indicated.",
  imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Punjab Institute of Cardiology", "Fatima Memorial Hospital"],
  yearsOfExperience: 12,
};

// Endocrinology (2)
const drBilalAhmad: Doctor = {
  id: "doctor_005",
  firstName: "Bilal",
  lastName: "Ahmad",
  credentials: ["MBBS", "PhD", "FCPS"],
  specialty: "endocrinology",
  subSpecialties: ["Diabetes Management", "Thyroid Disorders"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:30", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "08:30", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "08:30", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "08:30", endTime: "15:00" },
  ],
  rating: 4.9,
  reviewCount: 387,
  bio: "Dr. Bilal Ahmad is a renowned endocrinologist with dual expertise in clinical care and research. He specializes in diabetes management, including insulin pump therapy and continuous glucose monitoring, as well as thyroid and adrenal disorders. His research focuses on novel diabetes treatments.",
  imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: false,
  hospitalAffiliations: ["Shaukat Khanum Memorial Hospital", "Hameed Latif Hospital"],
  yearsOfExperience: 25,
};

const drSanaIqbal: Doctor = {
  id: "doctor_006",
  firstName: "Sana",
  lastName: "Iqbal",
  credentials: ["MBBS", "FCPS"],
  specialty: "endocrinology",
  subSpecialties: ["Reproductive Endocrinology", "Metabolic Bone Disease"],
  availability: [
    { dayOfWeek: "monday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "09:00", endTime: "13:00" },
  ],
  rating: 4.8,
  reviewCount: 198,
  bio: "Dr. Sana Iqbal specializes in hormonal disorders affecting women, including PCOS, gestational diabetes, and osteoporosis. She takes a holistic approach to endocrine care, integrating nutrition counseling and lifestyle medicine with traditional medical management.",
  imageUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Fatima Memorial Hospital", "Doctors Hospital Lahore"],
  yearsOfExperience: 10,
};

// Nephrology (1)
const drZainabShah: Doctor = {
  id: "doctor_007",
  firstName: "Zainab",
  lastName: "Shah",
  credentials: ["MBBS", "FCPS"],
  specialty: "nephrology",
  subSpecialties: ["Chronic Kidney Disease", "Dialysis Management"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "16:00" },
  ],
  rating: 4.7,
  reviewCount: 234,
  bio: "Dr. Zainab Shah is a board-certified nephrologist dedicated to slowing the progression of kidney disease and optimizing quality of life for patients at all stages of CKD. She provides comprehensive care from early kidney disease through dialysis and transplant evaluation.",
  imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Sheikh Zayed Hospital", "Shaukat Khanum Memorial Hospital"],
  yearsOfExperience: 16,
};

// OB/GYN (2)
const drMariamButt: Doctor = {
  id: "doctor_008",
  firstName: "Mariam",
  lastName: "Butt",
  credentials: ["MBBS", "FCPS", "FRCOG"],
  specialty: "ob_gyn",
  subSpecialties: ["High-Risk Pregnancy", "Maternal-Fetal Medicine"],
  availability: [
    { dayOfWeek: "monday", startTime: "07:30", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "07:30", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "07:30", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "07:30", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "07:30", endTime: "12:00" },
  ],
  rating: 4.9,
  reviewCount: 512,
  bio: "Dr. Mariam Butt is a highly experienced OB/GYN with subspecialty training in maternal-fetal medicine. She manages high-risk pregnancies, including those complicated by diabetes, hypertension, and multiple gestations. She is known for her compassionate, patient-centered approach to prenatal care.",
  imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Fatima Memorial Hospital", "Lady Willingdon Hospital"],
  yearsOfExperience: 20,
};

const drHiraQureshi: Doctor = {
  id: "doctor_009",
  firstName: "Hira",
  lastName: "Qureshi",
  credentials: ["MBBS", "FCPS"],
  specialty: "ob_gyn",
  subSpecialties: ["Minimally Invasive Surgery", "Reproductive Health"],
  availability: [
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "15:00" },
  ],
  rating: 4.6,
  reviewCount: 178,
  bio: "Dr. Hira Qureshi provides comprehensive gynecologic care with expertise in minimally invasive surgical techniques. She is passionate about women's reproductive health and offers services ranging from routine wellness exams to complex laparoscopic procedures.",
  imageUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Fatima Memorial Hospital", "Ittefaq Hospital"],
  yearsOfExperience: 8,
};

// Family Medicine (2)
const drKhadijaAli: Doctor = {
  id: "doctor_010",
  firstName: "Khadija",
  lastName: "Ali",
  credentials: ["MBBS", "FCPS"],
  specialty: "family_medicine",
  subSpecialties: ["Pediatric Care", "Sports Medicine"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "18:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "saturday", startTime: "09:00", endTime: "12:00" },
  ],
  rating: 4.8,
  reviewCount: 423,
  bio: "Dr. Khadija Ali is a family medicine physician who cares for patients of all ages, from newborns to seniors. She believes in building long-term relationships with her patients and their families. Her additional training in sports medicine allows her to treat athletic injuries and promote physical wellness.",
  imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Hameed Latif Hospital"],
  yearsOfExperience: 14,
};

const drImranChaudhry: Doctor = {
  id: "doctor_011",
  firstName: "Imran",
  lastName: "Chaudhry",
  credentials: ["MBBS", "FCPS"],
  specialty: "family_medicine",
  subSpecialties: ["Preventive Medicine", "Chronic Pain Management"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "14:00" },
  ],
  rating: 4.7,
  reviewCount: 267,
  bio: "Dr. Imran Chaudhry brings a holistic approach to family medicine. In addition to standard primary care, he specializes in preventive medicine and chronic pain management. He emphasizes preventive care and patient education.",
  imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Ittefaq Hospital", "Jinnah Hospital Lahore"],
  yearsOfExperience: 11,
};

// Pulmonology (1)
const drTariqSiddiqui: Doctor = {
  id: "doctor_012",
  firstName: "Tariq",
  lastName: "Siddiqui",
  credentials: ["MBBS", "FCPS", "FCCP"],
  specialty: "pulmonology",
  subSpecialties: ["Critical Care Medicine", "Sleep Medicine"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "16:00" },
  ],
  rating: 4.8,
  reviewCount: 312,
  bio: "Dr. Tariq Siddiqui is a pulmonologist and critical care specialist with expertise in asthma, COPD, interstitial lung diseases, and sleep disorders. He is trained in advanced bronchoscopic procedures and manages patients in both the outpatient and ICU settings.",
  imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Services Hospital Lahore", "Gulab Devi Hospital"],
  yearsOfExperience: 19,
};

// Export all mock doctors
export const MOCK_DOCTORS: Doctor[] = [
  drAyeshaKhan,
  drUsmanMalik,
  drAhmedRaza,
  drFatimaHussain,
  drBilalAhmad,
  drSanaIqbal,
  drZainabShah,
  drMariamButt,
  drHiraQureshi,
  drKhadijaAli,
  drImranChaudhry,
  drTariqSiddiqui,
];

// Validate all doctors against schema
MOCK_DOCTORS.forEach((doctor, index) => {
  const result = DoctorSchema.safeParse(doctor);
  if (!result.success) {
    console.error(`Doctor validation failed for index ${index}:`, result.error);
  }
});

// Export individual doctors for direct access
export {
  drAyeshaKhan,
  drUsmanMalik,
  drAhmedRaza,
  drFatimaHussain,
  drBilalAhmad,
  drSanaIqbal,
  drZainabShah,
  drMariamButt,
  drHiraQureshi,
  drKhadijaAli,
  drImranChaudhry,
  drTariqSiddiqui,
};

// Helper to get doctors by specialty
export function getDoctorsBySpecialty(specialty: string): Doctor[] {
  return MOCK_DOCTORS.filter((doctor) => doctor.specialty === specialty);
}

// Helper to get doctors accepting new patients
export function getAvailableDoctors(): Doctor[] {
  return MOCK_DOCTORS.filter((doctor) => doctor.acceptingNewPatients);
}
