import express from "express";
import cors from "cors";
import { prisma } from "./prismaClient.js";
import { userRouter } from "./routers/user.js";
import {postRouter} from "./routers/content.js"
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get("/info", (req, res) => {
  res.json({ msg: "my_backend_api" });
});
/***
 * @param {router from user }userRouter
 * @param {router from content} postRouter
 */
app.use("/", userRouter);
app.use('/content',postRouter)
const server = app.listen(5000, () => {
  console.log("server is runing in port 5000");
});

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log("Express API closed");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
