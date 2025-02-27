import { Router } from "express";
import { prisma } from "../prismaClient.js";
import bcrypt from "bcrypt";
import { auth, isChatMember } from "../middlewares/auth.js";
import JWT from "jsonwebtoken";
import { clients } from "../index.js";
const router = Router();

import {
  findCommentByuserId,
  findPostbyUserId,
  findUserbyuserId,
} from "../Query/BasicQuery.js";

const messageNoti=async({chatId,sender,message})=>{
  try{
    const chat=await prisma.chat.findUnique({where:{id:chatId},include:{users:true}})
    const [receiver]=chat.users.filter(m=>m.id!==sender.id)
    clients.map(m=>{
      if(m.user.id===receiver.id && m.socket.connected){
        m.socket.emit("newMessage",{sender,message})
      }
    })
  }catch(e){console.log(e)}
  
}

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

router.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: { name: { contains: q } },
      include: {
        followers: true,
        followings: true,
      },
    });
    if (users) {
      res.status(200).json(users);
    } else {
      res.sendStatus(400);
    }
  } catch (e) {
    console.log(e);
  }
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
      include: {
        following: { include: { followers: true, followings: true } },
      },
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

/***
 * create Chat
 */

router.post("/chat/create", auth, async (req, res) => {
  const userId = res.locals.user.id;
  const otheruser = req.body.userIds;
  if (otheruser.find((m) => m === userId)) return res.sendStatus(400);
  const userIds = [...otheruser, userId];
  if (!userIds) return res.sendStatus(400);
  try {
    if (userIds.length === 2) {
      const existingChat = await prisma.chat.findFirst({
        where: { AND: userIds.map((id) => ({ users: { some: { id: id } } })) },
      });
      if (existingChat) return res.status(200).json(existingChat);
    }
    const chat = await prisma.chat.create({
      data: {
        users: { connect: [...userIds.map((id) => ({ id })), { id: userId }] },
      },
      include: { users: true },
    });
    if (chat) {
      return res.status(200).json(chat);
    }
  } catch (e) {
    console.log(e);
  }
});

router.post("/:chatId/massage", auth, isChatMember, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const content = req.body.content;
  const senderId = res.locals.user.id;
  if (!chatId && !senderId && !content) return res.sendStatus(400);
  try {
    const message = await prisma.massage.create({
      data: {
        chatId,
        senderId,
        content,
      },
    });
    if (message) {
      await messageNoti({chatId,sender:res.locals.user,message})
      return res.status(200).json(message);
    }
  } catch (e) {
    console.log(e);
  }
});

router.get("/chats", auth, async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const chats = await prisma.chat.findMany({
      where: { users: { some: { id: userId } } },
      include: { users: true },
    });
    if (chats) return res.status(200).json(chats);
  } catch (e) {
    console.log(e);
  }
});

router.get("/:chatId/massages", auth, isChatMember, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const limit = Number(req.query.limit) || 30;
  const skip = Number(req.query.skip) || 0;
  try {
    const massages = await prisma.massage.findMany({
      where: { chatId: chatId },
      orderBy: { createAt: "desc" },
      take: limit,
      skip: skip,
    });
    if (massages) {
      return res.status(200).json(massages);
    }
  } catch (e) {
    console.log(e);
  }
});

router.put("/chat/:id",auth, async (req, res) => {
  const chatId = Number(req.params.id);
  const readId = Number(req.body.readId);
  if (!chatId || !readId) return res.sendStatus(400);
  try {
    const makeRead = await prisma.chat.update({
      data: { lastReadMessageId: readId },
      where: { id: chatId },
    });
    if(makeRead){
      return res.status(200).json(makeRead)
    }
  } catch (e) {
    console.log(e);
  }
});

export { router as userRouter };
