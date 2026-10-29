import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { prisma } from "../lib/prisma.js";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD (12 caractères min.) sont requis");
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    console.log("Le Super Administrateur existe déjà.");
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: "Super Administrateur",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      passwordHash: await hash(password),
    },
  });
  console.log("Super Administrateur créé :", email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
