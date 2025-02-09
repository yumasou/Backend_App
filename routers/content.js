import express from "express";
import { prisma } from "../prismaClient.js";
import { clients } from "../index.js";
const router = express.Router();
import { auth, isOwner } from "../middlewares/auth.js";
import {
  findCommentbycommentId,
  findCommentByPostId,
  findPostbypostId,
  findPostbyUserId,
} from "../Query/BasicQuery.js";

async function addNoti({ type, content, userId, postId }) {
  if (!type && !content && !userId && !postId) {
    return false;
  }
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post.userId === userId) return false;
  // console.log(clients)
  clients.map((m) => {
    if (m.user.id === post.userId && m.socket.connected) {
      m.socket.emit("Noti", `Someone ${content}`);
    }
  });
  await prisma.noti.create({
    data: {
      type,
      content,
      userId,
      postId,
    },
  });
}

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

router.get("/noti", auth, async (req, res) => {
  const id = Number(res.locals.user.id);

  try {
    const notis = await prisma.noti.findMany({
      where: { post: { userId: id } },
      include: {
        user: true,
      },
      orderBy: { id: "desc" },
      take: 20,
    });

    if (notis) {
      return res.status(200).json(notis);
    } else return res.sendStatus(400);
  } catch (e) {
    console.log(e);
  }
});

router.put("/noti/read", auth, async (req, res) => {
  const id = Number(res.locals.user.id);
  try {
    const makeRead = await prisma.noti.updateMany({
      data: { read: true },
      where: { post: { userId: id } },
    });
    if (makeRead) {
      return res.status(200).json({ msg: "made all as read" });
    }
  } catch (e) {
    console.log(e);
  }
});

router.put("/noti/read/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(res.locals.user.id);
 
  try {
    const makeRead = await prisma.noti.updateMany({
      data: { read: true },
      where: { id: id, post: { userId: userId } },
    });
    if (makeRead) {
      return res.status(200).json({ msg: "made as read" });
    }
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
    if (data) {
      return res.status(200).json(data);
    }
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
    if (data) {
      await addNoti({
        type: "Comment",
        content: "reply your Post",
        userId: userIdInt,
        postId: postIdInt,
      });
      return res.status(200).json(data);
    }
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
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });
      await addNoti({
        type: "Like",
        content: "like your Comment",
        userId,
        postId: comment.postId,
      });
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
      await addNoti({
        type: "Like",
        content: "like your Post",
        userId,
        postId,
      });
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
    await prisma.post.delete({
      where: { id: id },
    });
    return res.sendStatus(204);
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
          userId: res.locals.user.id,
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
        where: { postId: id, userId: res.locals.user.id },
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
