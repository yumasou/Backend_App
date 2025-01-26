import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const likeSeeder = async () => {
  const postId = 10;
  const data = [];
  for (let i = 0; i < 5; i++) {
    const userId = faker.number.int({ min: 1, max:10 });
    data.push({ userId, postId });
  }

  console.log("PostLike seeding");
  await prisma.postlike.createMany({ data });
  console.log("postlike seeding done");
};
