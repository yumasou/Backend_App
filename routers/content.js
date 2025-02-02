import express from "express";
import { prisma } from "../prismaClient.js";
const router = express.Router();
import { auth, isOwner } from "../middlewares/auth.js";
import {
  findCommentbycommentId,
  findCommentByPostId,
  findPostbypostId,
  findPostbyUserId,
} from "../Query/BasicQuery.js";

router.get("/followingposts", auth, async (req, res) => {
  const id = Number(res.locals.user.id);
  if (!id) res.sendStatus(401);
  try {
    const follower = await prisma.follow.findMany({
      where: {
        followerId: id,
      },
    });
    if (follower) {
      const users = follower.map((m) => {
        return m.followingId;
      });
      if (users) {
        const posts = await prisma.post.findMany({
          where: {
            userId: { in: users },
          },
          include: {
            user: true,
            comments: { include: { user: true } },
            postLikes: true,
            _count: {
              select: {
                comments: true,
                postLikes: true,
              },
            },
          },
          orderBy: { id: "desc" },
        });
        return res.status(200).json(posts);
      }
    } else {
      return res.status(400).json({ msg: "User don't have following" });
    }
  } catch (e) {
    console.log(e);
  }
});

router.get("/likes/posts/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    if (!id) {
      return res.sendStatus(400);
    }
    const likes = await prisma.postlike.findMany({
      where: { postId: id },
      include: { user: { include: { followers: true, followings: true } } },
    });

    const count = likes.length;

    res.status(200).json({ likes, count });
  } catch (e) {
    console.log(e);
  }
});

router.get("/likes/comments/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    if (!id) {
      return res.sendStatus(400);
    }
    const likes = await prisma.commentlike.findMany({
      where: { commentId: id },
      include: { user: { include: { followers: true, followings: true } } },
    });

    const count = likes.length;

    res.status(200).json({ likes, count });
  } catch (e) {
    console.log(e);
  }
});

router.get("/posts", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const data = await prisma.post.findMany({
      include: {
        user: true,
        comments: { include: { user: true } },
        postLikes: true,
        _count: {
          select: {
            comments: true,
            postLikes: true,
          },
        },
      },
      orderBy: { id: "desc" },
      take: limit,
      skip: skip,
    });
    return res.status(200).json({ limit: limit, skip: skip, data });
  } catch (e) {
    console.log(e);
  }
});

router.get("/posts/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.sendStatus(400);
  }
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const data = await prisma.post.findFirst({
      where: { id: Number(id) },
      include: {
        user: true,
        comments: {
          include: {
            user: true,
            commentLikes: true,
            _count: {
              select: {
                commentLikes: true,
              },
            },
          },
        },
        postLikes: true,
        _count: {
          select: {
            postLikes: true,
          },
        },
      },
      take: limit,
      skip: skip,
    });
    return res.status(200).json({ limit: limit, skip: skip, data });
  } catch (e) {
    console.log(e);
  }
});

router.post("/posts", auth, async (req, res) => {
  const { content, userId } = req.body;
  const userIdInt = parseInt(userId);
  if (!content || !userIdInt) {
    return res.sendStatus(400);
  }
  try {
    const data = await prisma.post.create({
      data: {
        content,
        userId: userIdInt,
      },
    });
    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
  }
});

router.post("/comments", auth, async (req, res) => {
  const { content, userId, postId } = req.body;
  const postIdInt = parseInt(postId);
  const userIdInt = parseInt(userId);
  if (!content || !userIdInt || !postIdInt) {
    return res.status(400);
  }
  try {
    const data = await prisma.comment.create({
      data: {
        content,
        userId: userIdInt,
        postId: postIdInt,
      },
    });
    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
  }
});

router.post("/like/comments/:id", auth, async (req, res) => {
  const commentId = Number(req.params.id);
  const userId = Number(res.locals.user.id);
  try {
    if (!userId || !commentId) {
      return res.sendStatus(400);
    }
    const commentlike = await prisma.commentlike.create({
      data: { commentId: commentId, userId: userId },
    });
    if (commentlike) {
      return res.status(200).json(commentlike);
    } else {
      return res.sendStatus(400);
    }
  } catch (e) {
    console.log(e);
  }
});

router.post("/like/posts/:id", auth, async (req, res) => {
  const postId = Number(req.params.id);
  try {
    const userId = Number(res.locals.user.id);
    if (!userId || !postId) {
      return res.status(401).json({ msg: "user not login" });
    }
    const liked = await prisma.postlike.create({
      data: { postId: postId, userId: userId },
    });
    if (liked) {
      res.status(200).json(liked);
    }
  } catch (e) {
    console.log(e);
  }
});

router.delete("/posts/:id", auth, isOwner("post"), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.sendStatus(400);
  }
  try {
    const comment = await findCommentByPostId(id);
    if (comment) {
      await prisma.comment.deleteMany({
        where: { postId: id },
      });
    }
    const post = await findPostbypostId(id);
    if (post) {
      await prisma.post.delete({
        where: { id: id },
      });
      return res.sendStatus(204);
    } else return res.sendStatus(400);
  } catch (e) {
    console.log(e);
  }
});

router.delete("/comments/:id", auth, isOwner("comment"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.sendStatus(400);
    }
    const comment = findCommentbycommentId(id);
    if (comment) {
      await prisma.comment.delete({
        where: {
          id: id,
        },
      });
      return res.sendStatus(204);
    }
    return res.sendStatus(400);
  } catch (e) {
    console.log(e);
  }
});

router.delete(
  "/unlike/comments/:id",
  auth,
  isOwner("commentLike"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      const unlike = await prisma.commentlike.deleteMany({
        where: {
          commentId: id,
        },
      });
      if (unlike) {
        return res.sendStatus(204);
      } else {
        return res.sendStatus(400);
      }
    } catch (e) {
      console.log(e);
    }
  }
);

router.delete(
  "/unlike/posts/:id",
  auth,
  isOwner("postLike"),
  async (req, res) => {
    const id = Number(req.params.id);
    try {
      const unlike = await prisma.postlike.deleteMany({
        where: { postId: id },
      });
      if (unlike) {
        return res.sendStatus(204);
      } else {
        return res.sendStatus(400);
      }
    } catch (e) {
      console.log(e);
    }
  }
);

export { router as postRouter };
