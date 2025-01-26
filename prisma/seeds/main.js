import { PrismaClient } from "@prisma/client";
import { UserSeeder } from "./UserSeeder.js";
import { PostSeeder } from "./PostSeeder.js";
import { CommentSeeder } from "./CommentSeeder.js";
import { likeSeeder } from "./likeSeeder.js";
const prisma = new PrismaClient();

async function main() {
  try {
    await UserSeeder();
    await PostSeeder();
    await CommentSeeder();
    await likeSeeder();
  } catch (e) {
    console.error("Error seeding database:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
