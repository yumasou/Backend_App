import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
const prisma = new PrismaClient();

export const PostSeeder=async  ()=> {
  const data = [];
  for (let i = 0; i < 20; i++) {
    const content = faker.lorem.paragraph();
    const userId = faker.number.int({ min: 1, max: 10 });
    data.push({ content, userId });
  }
  console.log("post seeding started...");
  await prisma.post.createMany({
    data,
  });
  console.log("post seeding done");
}

