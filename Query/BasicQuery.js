import { prisma } from "../prismaClient.js";
export const findCommentByuserId = async (id) => {
  return await prisma.comment.findFirst({ where: { userId: id } });
};
export const findCommentByPostId = async (id) => {
  return await prisma.comment.findFirst({ where: { postId: id } });
};

export const findPostbyUserId = async (id) => {
  return await prisma.post.findFirst({ where: { userId: id } });
};

export const findPostbypostId = async (id) => {
  return await prisma.post.findFirst({ where: { id: id } });
};

export const findUserbyuserId = async (id) => {
  return await prisma.user.findFirst({ where: { id: id } });
};

export const findCommentbycommentId = async (id) => {
  return await prisma.comment.findFirst({ where: { id: id } });
};
