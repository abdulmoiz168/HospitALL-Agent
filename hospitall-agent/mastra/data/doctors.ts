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

// Export all mock doctors
export const MOCK_DOCTORS: Doctor[] = [
  drAyeshaKhan,
  drAhmedRaza,
  drSanaIqbal,
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
};

// Helper to get doctors by specialty
export function getDoctorsBySpecialty(specialty: string): Doctor[] {
  return MOCK_DOCTORS.filter((doctor) => doctor.specialty === specialty);
}

// Helper to get doctors accepting new patients
export function getAvailableDoctors(): Doctor[] {
  return MOCK_DOCTORS.filter((doctor) => doctor.acceptingNewPatients);
}
