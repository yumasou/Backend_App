import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const CommentSeeder=async () =>{
  const data = [];
  for (let i = 0; i < 40; i++) {
    const content = faker.lorem.paragraph();
    const userId = faker.number.int({ min: 1, max: 10 });
    const postId = faker.number.int({ min: 1, max: 20 });
    data.push({ content, userId, postId });
  }
  console.log("comment seeding started...");
  await prisma.comment.createMany({ data });
  console.log("comment seeding done...");
}
