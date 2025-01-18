import { Router } from "express";
import { prisma } from "../prismaClient.js";
import bcrypt from "bcrypt"
const router = Router();
import {findCommentByuserId,findPostbyUserId,findUserbyuserId} from "../Query/BasicQuery.js"
router.get("/users", async (req, res) => {
    const limit=Number(req.query.limit) || 20
    const skip=Number(req.query.skip) || 0
  const users = await prisma.user.findMany({
    include: { posts: true, comments: true },
    orderBy: { id: "desc" },
    take: limit,
    skip:skip
  });
  res.status(200).json(users);
});
router.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const data = await prisma.user.findFirst({
    where: {
      id:id,
    },
    include: {
      posts: true,
      comments: true,
    },
  });
  res.status(200).json(data);
});

router.post('/users',async(req,res)=>{
    const{name,username,email,bio,password}=req.body
    if(!name || !username || !email || !password){
       return res.status(400).json({msg:"name,username,password required"})
    }
    try{
        const hashedPassword=await bcrypt.hash(password,10)
        const data=await prisma.user.create({
            data:{
                name,username,email,bio,password:hashedPassword
            }
        })
        res.status(200).json(data)
    }
    catch(e){
        console.log(e)
    }
    
})

router.delete('/users/:id',async(req,res)=>{
    const id=Number(req.params.id)
    try{
        const comment=await findCommentByuserId(id)
        
        if(comment){
            await prisma.comment.deleteMany({
                where:{userId:id}
            })
        }
         const post=await findPostbyUserId(id)
        
        if(post){
            await prisma.post.deleteMany({
                where:{userId:id}
            })
        }
        const user=await findUserbyuserId(id)
        
        if(user){
            await prisma.user.delete({
                where:{id:id}
            })
            return res.sendStatus(204)
        }
        
        res.sendStatus(400)
    }catch(e){console.log(e)}
})

export { router as userRouter };
