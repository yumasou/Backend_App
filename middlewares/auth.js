import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";
/***
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Express.next} next
 */
const auth = async (req, res, next) => {
  const Authorization = req.headers.authorization;
  if (!Authorization) {
    return res.sendStatus(401);
  }
  const token = Authorization && Authorization.split(" ")[1];
  const user = jwt.verify(token, process.env.JWT_SECRECT);
  if (user) {
    res.locals.user = user;
    next();
  }
  else return res.sendStatus(401);
};

const isOwner = (type) => {
  return async (req, res, next) => {
    try {
      if (type === "post") {
        const id = Number(req.params.id);
        console.log(id);
        const post = await prisma.post.findFirst({
          where: {
            id: id,
          },
        });
        console.log(res.locals.user);
        if (post) {
          if (post.userId === res.locals.user.id) {
            next();
          }
        } else {
          return res.sendStatus(403);
        }
      }
      if (type === "comment") {
        const id = Number(req.params.id);
        const comment = await prisma.comment.findFirst({
          where: {
            id: id,
          },
          include: {
            post: true,
          },
        });
        if (comment) {
          if (
            comment.userId == res.locals.user.id ||
            comment.post.userId == res.locals.user.id
          ) {
            next();
          } else {
            return res.sendStatus(403);
          }
        }
      }

      if (type === "postLike") {
        const id = Number(req.params.id);
        const like = await prisma.postlike.findFirst({
          where: { postId: id },
        });
        if (like) {
          if (like.userId === res.locals.user.id) {
            return next();
          }
        }
       else return res.sendStatus(403);
      }

      if (type === "commentLike") {
        const id = Number(req.params.id);
        const commentlike = await prisma.commentlike.findFirst({
          where: { commentId: id },
        });
        if (commentlike) {
          if (commentlike.userId === res.locals.user.id) {
            return next();
          }
        }
       else return res.sendStatus(403);
      }
    } catch (e) {
      next(e);
    }
  };
};

export { auth, isOwner };
