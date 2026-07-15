import "dotenv/config";

import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const mentorEmail = process.env.SEED_MENTOR_EMAIL || "mentor@taskform.dev";
const mentorPassword = process.env.SEED_MENTOR_PASSWORD || "mentor363";
const mentorName = process.env.SEED_MENTOR_NAME || "Alfin - Mentor";

const santriList = [
  "Hudzaifah",
  "Hammas",
  "Raihan",
  "Fairuz",
  "Ibrohim",
  "Yazid",
  "Satrio",
  "Revaldi",
  "Faren",
  "Faris",
  "Dzaky",
];

async function main() {
  try {
    console.log("Seeding database...");

    // 1. Seed Mentor
    const existingMentor = await prisma.user.findUnique({
      where: { email: mentorEmail },
    });

    if (!existingMentor) {
      const result = await auth.api.signUpEmail({
        body: {
          email: mentorEmail,
          password: mentorPassword,
          name: mentorName,
          role: "mentor",
        },
      });
      console.log("Successfully seeded mentor user:", result.user.email);
    } else {
      console.log("Mentor user already exists:", mentorEmail);
    }

    // 2. Seed Santri (Students)
    for (const name of santriList) {
      const email = `${name.toLowerCase()}@taskform.dev`;
      const existingSantri = await prisma.user.findUnique({
        where: { email },
      });

      if (!existingSantri) {
        const result = await auth.api.signUpEmail({
          body: {
            email,
            password: "santri123",
            name,
            role: "student",
          },
        });
        console.log("Successfully seeded santri user:", result.user.name, `(${result.user.email})`);
      } else {
        console.log("Santri user already exists:", name, `(${email})`);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
