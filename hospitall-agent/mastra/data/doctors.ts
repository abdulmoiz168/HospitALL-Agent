import { Doctor, DoctorSchema } from "../schemas/doctor";

// Internal Medicine
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

// Cardiology
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

// Endocrinology
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

// Pulmonology
const drFarhanMalik: Doctor = {
  id: "doctor_007",
  firstName: "Farhan",
  lastName: "Malik",
  credentials: ["MBBS", "FCPS", "MRCP"],
  specialty: "pulmonology",
  subSpecialties: ["Critical Care Medicine", "Interventional Pulmonology", "Sleep Medicine"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "14:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "16:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "14:00" },
  ],
  rating: 4.9,
  reviewCount: 287,
  bio: "Dr. Farhan Malik is a pulmonologist and critical care specialist with extensive experience in managing respiratory infections, COPD, asthma, and pulmonary fibrosis. He has been instrumental in setting up ICU protocols and has published research on ARDS management.",
  imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Gulab Devi Chest Hospital", "Shaukat Khanum Memorial Hospital"],
  yearsOfExperience: 15,
};

// Neurology
const drNadiaHussain: Doctor = {
  id: "doctor_008",
  firstName: "Nadia",
  lastName: "Hussain",
  credentials: ["MBBS", "FCPS", "FRCP"],
  specialty: "neurology",
  subSpecialties: ["Epilepsy", "Stroke Medicine", "Headache Disorders"],
  availability: [
    { dayOfWeek: "monday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "saturday", startTime: "10:00", endTime: "14:00" },
  ],
  rating: 4.7,
  reviewCount: 412,
  bio: "Dr. Nadia Hussain is a consultant neurologist specializing in epilepsy management, stroke prevention, and chronic headache disorders. She completed her fellowship in the UK and brings international expertise to her practice. She is known for her patient-centered approach to complex neurological conditions.",
  imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
  languages: ["Urdu", "English", "Sindhi"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Aga Khan University Hospital", "South City Hospital Karachi"],
  yearsOfExperience: 14,
};

// Nephrology
const drUmarFarooq: Doctor = {
  id: "doctor_009",
  firstName: "Umar",
  lastName: "Farooq",
  credentials: ["MBBS", "FCPS", "FASN"],
  specialty: "nephrology",
  subSpecialties: ["Dialysis", "Kidney Transplant", "Hypertensive Nephropathy"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "15:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "15:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "15:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "15:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "12:00" },
  ],
  rating: 4.8,
  reviewCount: 234,
  bio: "Dr. Umar Farooq is a nephrologist with expertise in chronic kidney disease management, dialysis care, and kidney transplant evaluation. He has helped establish affordable dialysis programs and is passionate about preventive nephrology education.",
  imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Sheikh Zayed Hospital Lahore", "Kidney Centre Lahore"],
  yearsOfExperience: 12,
};

// OB/GYN
const drFarahNaz: Doctor = {
  id: "doctor_010",
  firstName: "Farah",
  lastName: "Naz",
  credentials: ["MBBS", "FCPS", "MRCOG"],
  specialty: "ob_gyn",
  subSpecialties: ["High-Risk Pregnancy", "Laparoscopic Surgery", "Infertility"],
  availability: [
    { dayOfWeek: "monday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "tuesday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "wednesday", startTime: "10:00", endTime: "14:00" },
    { dayOfWeek: "thursday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "saturday", startTime: "10:00", endTime: "14:00" },
  ],
  rating: 4.9,
  reviewCount: 523,
  bio: "Dr. Farah Naz is a highly experienced obstetrician and gynecologist specializing in high-risk pregnancies, minimally invasive gynecological surgery, and infertility treatment. She has delivered over 5,000 babies and is known for her compassionate care.",
  imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Lady Willingdon Hospital", "Hameed Latif Hospital Lahore"],
  yearsOfExperience: 20,
};

// Pediatrics
const drBilalAhmad: Doctor = {
  id: "doctor_011",
  firstName: "Bilal",
  lastName: "Ahmad",
  credentials: ["MBBS", "FCPS", "DCH"],
  specialty: "pediatrics",
  subSpecialties: ["Neonatology", "Pediatric Infectious Diseases", "Developmental Pediatrics"],
  availability: [
    { dayOfWeek: "monday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "thursday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: "saturday", startTime: "10:00", endTime: "14:00" },
  ],
  rating: 4.9,
  reviewCount: 678,
  bio: "Dr. Bilal Ahmad is a pediatrician with special interest in newborn care, childhood infections, and developmental milestones. Parents trust him for his gentle approach with children and thorough explanations. He actively promotes childhood vaccination programs.",
  imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Children's Hospital Lahore", "Shalamar Hospital"],
  yearsOfExperience: 16,
};

// Orthopedics
const drTariqMehmood: Doctor = {
  id: "doctor_012",
  firstName: "Tariq",
  lastName: "Mehmood",
  credentials: ["MBBS", "FCPS", "FRCS"],
  specialty: "orthopedics",
  subSpecialties: ["Joint Replacement", "Sports Medicine", "Spine Surgery"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "14:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "14:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "14:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "14:00" },
    { dayOfWeek: "saturday", startTime: "09:00", endTime: "13:00" },
  ],
  rating: 4.8,
  reviewCount: 389,
  bio: "Dr. Tariq Mehmood is an orthopedic surgeon specializing in hip and knee replacements, sports injuries, and spinal disorders. He has performed over 2,000 joint replacement surgeries and uses the latest minimally invasive techniques for faster recovery.",
  imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Ghurki Trust Hospital", "National Hospital Lahore"],
  yearsOfExperience: 19,
};

// Psychiatry
const drAmnaRiaz: Doctor = {
  id: "doctor_013",
  firstName: "Amna",
  lastName: "Riaz",
  credentials: ["MBBS", "FCPS", "MRCPsych"],
  specialty: "psychiatry",
  subSpecialties: ["Anxiety Disorders", "Depression", "Addiction Medicine"],
  availability: [
    { dayOfWeek: "monday", startTime: "11:00", endTime: "19:00" },
    { dayOfWeek: "tuesday", startTime: "11:00", endTime: "19:00" },
    { dayOfWeek: "wednesday", startTime: "11:00", endTime: "19:00" },
    { dayOfWeek: "thursday", startTime: "11:00", endTime: "19:00" },
    { dayOfWeek: "friday", startTime: "11:00", endTime: "15:00" },
  ],
  rating: 4.7,
  reviewCount: 156,
  bio: "Dr. Amna Riaz is a consultant psychiatrist with expertise in anxiety, depression, and substance use disorders. She combines medication management with psychotherapy and believes in reducing mental health stigma. She offers a safe, non-judgmental space for patients.",
  imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400",
  languages: ["Urdu", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Fountain House Lahore", "CMH Lahore"],
  yearsOfExperience: 11,
};

// Gastroenterology
const drKashifAli: Doctor = {
  id: "doctor_014",
  firstName: "Kashif",
  lastName: "Ali",
  credentials: ["MBBS", "FCPS", "FACG"],
  specialty: "gastroenterology",
  subSpecialties: ["Hepatology", "Endoscopy", "Inflammatory Bowel Disease"],
  availability: [
    { dayOfWeek: "monday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "tuesday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "wednesday", startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: "thursday", startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: "friday", startTime: "09:00", endTime: "13:00" },
  ],
  rating: 4.8,
  reviewCount: 312,
  bio: "Dr. Kashif Ali is a gastroenterologist and hepatologist with expertise in liver diseases, IBD, and therapeutic endoscopy. He has performed thousands of endoscopic procedures and specializes in managing hepatitis B and C, which are prevalent in Pakistan.",
  imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
  languages: ["Urdu", "Punjabi", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Pakistan Kidney and Liver Institute", "Doctors Hospital Lahore"],
  yearsOfExperience: 17,
};

// Dermatology
const drSabaKarim: Doctor = {
  id: "doctor_015",
  firstName: "Saba",
  lastName: "Karim",
  credentials: ["MBBS", "FCPS", "DABD"],
  specialty: "dermatology",
  subSpecialties: ["Cosmetic Dermatology", "Pediatric Dermatology", "Skin Cancer"],
  availability: [
    { dayOfWeek: "monday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "tuesday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "wednesday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "thursday", startTime: "10:00", endTime: "18:00" },
    { dayOfWeek: "saturday", startTime: "10:00", endTime: "15:00" },
  ],
  rating: 4.7,
  reviewCount: 445,
  bio: "Dr. Saba Karim is a dermatologist treating conditions from acne and eczema to complex skin disorders. She offers both medical dermatology and cosmetic procedures including laser treatments. She has special interest in treating skin conditions in children.",
  imageUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
  languages: ["Urdu", "English"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Skin Care Clinic Lahore", "Ittefaq Hospital"],
  yearsOfExperience: 9,
};

// Family Medicine
const drImranSiddiqui: Doctor = {
  id: "doctor_016",
  firstName: "Imran",
  lastName: "Siddiqui",
  credentials: ["MBBS", "FCPS", "MRCGP"],
  specialty: "family_medicine",
  subSpecialties: ["Preventive Medicine", "Chronic Disease Management", "Geriatrics"],
  availability: [
    { dayOfWeek: "monday", startTime: "08:00", endTime: "20:00" },
    { dayOfWeek: "tuesday", startTime: "08:00", endTime: "20:00" },
    { dayOfWeek: "wednesday", startTime: "08:00", endTime: "20:00" },
    { dayOfWeek: "thursday", startTime: "08:00", endTime: "20:00" },
    { dayOfWeek: "friday", startTime: "08:00", endTime: "17:00" },
    { dayOfWeek: "saturday", startTime: "09:00", endTime: "14:00" },
  ],
  rating: 4.9,
  reviewCount: 892,
  bio: "Dr. Imran Siddiqui is a family physician providing comprehensive primary care for patients of all ages. He believes in building long-term relationships with families and focuses on preventive care, health screenings, and managing chronic conditions like diabetes and hypertension.",
  imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
  languages: ["Urdu", "Punjabi", "English", "Pashto"],
  acceptingNewPatients: true,
  hospitalAffiliations: ["Family Health Clinic", "Services Hospital Lahore"],
  yearsOfExperience: 24,
};

// Export all mock doctors
export const MOCK_DOCTORS: Doctor[] = [
  drAyeshaKhan,
  drAhmedRaza,
  drSanaIqbal,
  drFarhanMalik,
  drNadiaHussain,
  drUmarFarooq,
  drFarahNaz,
  drBilalAhmad,
  drTariqMehmood,
  drAmnaRiaz,
  drKashifAli,
  drSabaKarim,
  drImranSiddiqui,
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
  drAhmedRaza,
  drSanaIqbal,
  drFarhanMalik,
  drNadiaHussain,
  drUmarFarooq,
  drFarahNaz,
  drBilalAhmad,
  drTariqMehmood,
  drAmnaRiaz,
  drKashifAli,
  drSabaKarim,
  drImranSiddiqui,
};

// Helper to get doctors by specialty
export function getDoctorsBySpecialty(specialty: string): Doctor[] {
  return MOCK_DOCTORS.filter((doctor) => doctor.specialty === specialty);
}

// Helper to get doctors accepting new patients
export function getAvailableDoctors(): Doctor[] {
  return MOCK_DOCTORS.filter((doctor) => doctor.acceptingNewPatients);
}
