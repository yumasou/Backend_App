import { Router } from "express";
import { prisma } from "../prismaClient.js";
import bcrypt from "bcrypt";
import { auth } from "../middlewares/auth.js";
import JWT from "jsonwebtoken";
const router = Router();

import {
  findCommentByuserId,
  findPostbyUserId,
  findUserbyuserId,
} from "../Query/BasicQuery.js";

router.get("/users", async (req, res) => {
  // const limit = Number(req.query.limit) || 20;
  // const skip = Number(req.query.skip) || 0;
  const users = await prisma.user.findMany({
    include: { posts: true, comments: true, followers: true, followings: true },
    orderBy: { id: "desc" },
    // take: limit,
    // skip: skip,
  });
  return res.status(200).json(users);
});
router.get("/followers/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: id },
      include: { follower: { include: { followings: true, followers: true } } },
    });
    if (followers) {
      res.status(200).json(followers);
    } else {
      res.sendStatus(400);
    }
  } catch (e) {
    console.log(e);
  }
});
router.get("/followings/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const followings = await prisma.follow.findMany({
      where: { followerId: id },
      include: { following: { include: { followers: true, followings: true } } },
    });
    if (followings) {
      res.status(200).json(followings);
    } else {
      res.sendStatus(400);
    }
  } catch (e) {
    console.log(e);
  }
});

router.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.sendStatus(400);
  }
  const data = await prisma.user.findFirst({
    where: {
      id: id,
    },
    include: {
      posts: {
        include: {
          postLikes: true,
          user: true,
          _count: { select: { postLikes: true } },
        },
      },
      comments: {
        include: {
          commentLikes: true,
          _count: { select: { commentLikes: true } },
        },
      },
      followers: { include: { following: true } },
      followings: { include: { follower: true } },
      _count: {
        select: {
          posts: true,
          followers: true,
          followings: true,
        },
      },
    },
  });
  return res.status(200).json(data);
});

router.post("/users", async (req, res) => {
  const { name, username, email, bio, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ msg: "name,username,password required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = await prisma.user.create({
      data: {
        name,
        username,
        email,
        bio,
        password: hashedPassword,
      },
    });
    return res.status(200).json(data);
  } catch (e) {
    console.log(e);
  }
});

router.delete("/users/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.sendStatus(400);
  }
  try {
    const comment = await findCommentByuserId(id);

    if (comment) {
      await prisma.comment.deleteMany({
        where: { userId: id },
      });
    }
    const post = await findPostbyUserId(id);

    if (post) {
      await prisma.post.deleteMany({
        where: { userId: id },
      });
    }
    const user = await findUserbyuserId(id);

    if (user) {
      await prisma.user.delete({
        where: { id: id },
      });
      return res.sendStatus(204);
    }

    return res.sendStatus(400);
  } catch (e) {
    console.log(e);
  }
});

/***
 * @param {Express.request} req
 * @param {Express.response} res
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json("Incorrect username or password");
    }
    const user = await prisma.user.findUnique({
      where: { username: username },
      include: {
        posts: true,
      },
    });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const token = JWT.sign(user, process.env.JWT_SECRECT);
        return res
          .status(200)
          .json({ token, user: { ...user, password: null } });
      }
    }
    return res.sendStatus(404);
  } catch (e) {
    console.log(e);
  }
});

router.post("/follow/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const userid = Number(res.locals.user.id);
  if (!userid || !id) {
    return res.sendStatus(400);
  }
  try {
    const result = await prisma.follow.create({
      data: { followerId: userid, followingId: id },
    });
    if (result) {
      return res.status(200).json(result);
    }
  } catch (e) {
    console.log(e);
  }
});

router.delete("/unfollow/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const userid = Number(res.locals.user.id);
  if (!userid || !id) {
    return res.sendStatus(400);
  }
  try {
    const result = await prisma.follow.deleteMany({
      where: {
        followingId: id,
        followerId: userid,
      },
    });
    if (result) {
      return res.status(200).json(result);
    }
  } catch (e) {
    console.log(e);
  }
});

export { router as userRouter };
