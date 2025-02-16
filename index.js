import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { prisma } from "./prismaClient.js";
import { userRouter } from "./routers/user.js";
import { postRouter } from "./routers/content.js";
import jwt from "jsonwebtoken";
const secrect = process.env.JWT_SECRECT;
const app = express();
const httpServer = http.createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
export const clients = [];

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.disconnect(true); // Disconnect if no token
    return;
  }
  jwt.verify(token, secrect, (err, user) => {
    if (err) return false;
    if (clients.find((m) => m.user.id === user.id)) {
      clients.forEach((m, index) => {
        if (m.user.id === user.id) {
          clients[index] = { ...m, socket };
        }
      });
    } 
  });
  console.log(`user connected : ${socket.id}`);
  socket.on("token", (token) => {
    // console.log(`token value ${token}`)
    if (!token) return false;
    jwt.verify(token, secrect, (err, user) => {
      if (err) return false;
      if (clients.find((m) => m.user.id === user.id)) {
        clients.forEach((m, index) => {
          if (m.user.id === user.id) {
            clients[index] = { ...m, socket };
          }
        });
      } else clients.push({ user, socket });
    });
  });
  socket.on("disconnect", () => {
    clients.filter((m) => m.socket.id !== socket.id);
    console.log(`User disconnected: ${socket.id}`);
  });
});

/***
 * middleware
 */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

/***
 * testing route
 */
app.get("/info", (req, res) => {
  res.json({ msg: "my_backend_api" });
});

/***
 * @param {router from user }userRouter
 * @param {router from content} postRouter
 */
app.use("/", userRouter);
app.use("/content", postRouter);

const server = httpServer.listen(5000, () => {
  console.log("server is runing in port 5000");
});

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  io.close(() => {
    console.log("Socket.io server closed");
  });
  server.close(() => {
    console.log("Express API closed");
    process.exit(0);
  });
};

//Handle termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
