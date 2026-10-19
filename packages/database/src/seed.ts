import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: "+919999999999" },
    update: {},
    create: { name: "NeighbourDoc Operations Admin", phone: "+919999999999", role: "superadmin", language: "English" }
  });

  const patientUser = await prisma.user.upsert({
    where: { phone: "+919876543210" },
    update: {},
    create: { name: "रमेश कुमार", phone: "+919876543210", role: "patient", language: "Hindi" }
  });

  const doctor1User = await prisma.user.upsert({
    where: { phone: "+919800000001" },
    update: {},
    create: { name: "डॉ. प्रिया शर्मा", phone: "+919800000001", role: "doctor", language: "Hindi" }
  });

  const doctor2User = await prisma.user.upsert({
    where: { phone: "+919800000002" },
    update: {},
    create: { name: "डॉ. राहुल वर्मा", phone: "+919800000002", role: "doctor", language: "Hindi" }
  });

  const patient = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: { userId: patientUser.id, age: 34, gender: "male", city: "Lucknow", locality: "Aliganj" }
  });

  const doctor1 = await prisma.doctorProfile.upsert({
    where: { userId: doctor1User.id },
    update: {},
    create: {
      userId: doctor1User.id,
      registrationNumber: "NMC-LKO-1001",
      qualification: "MBBS",
      specialization: "General Physician",
      verificationStatus: "verified",
      availabilityStatus: "online",
      languages: ["Hindi", "English"],
      city: "Lucknow"
    }
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctor2User.id },
    update: {},
    create: {
      userId: doctor2User.id,
      registrationNumber: "NMC-KNP-1002",
      qualification: "MBBS, MD",
      specialization: "Internal Medicine",
      verificationStatus: "verified",
      availabilityStatus: "online",
      languages: ["Hindi"],
      city: "Kanpur"
    }
  });

  await prisma.consultation.upsert({
    where: { publicId: "ND1001" },
    update: {},
    create: {
      publicId: "ND1001",
      patientId: patient.id,
      doctorId: doctor1.id,
      symptoms: "मौसम का बुखार और सिरदर्द (3 दिन से)",
      urgencyLevel: "normal",
      status: "assigned",
      paymentStatus: "paid",
      callbackDeadline: new Date(Date.now() + 15 * 60_000),
      consentAt: new Date()
    }
  });

  console.log(`✓ Seeded NeighbourDoc with Admin: ${admin.phone} and Doctors: ${doctor1User.phone}, ${doctor2User.phone}`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
