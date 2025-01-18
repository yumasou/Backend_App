import { PrismaClient } from "@prisma/client";
import { UserSeeder } from "./UserSeeder.js";
import { PostSeeder } from "./PostSeeder.js";
import { CommentSeeder } from "./CommentSeeder.js";

const prisma = new PrismaClient();

async function main() {
  try {
    await UserSeeder();
    await PostSeeder();
    await CommentSeeder();
  } catch (e) {
    console.error("Error seeding database:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
