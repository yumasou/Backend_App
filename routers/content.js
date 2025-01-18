import express  from "express";
import { prisma } from "../prismaClient.js";
const router = express.Router();
import {findCommentbycommentId, findCommentByPostId,findPostbypostId,findPostbyUserId} from "../Query/BasicQuery.js"
router.get("/posts", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const data = await prisma.post.findMany({
      include: {
        user: true,
        comments: {include:{user: true,}
        },
      },
      orderBy: { id: "desc" },
      take: limit,
      skip: skip,
    });
    res.status(200).json({limit:limit,skip:skip,data});
  } catch (e) {
    console.log(e);
  }
});

router.get("/posts/:id",async(req,res)=>{
    try{
        
        const limit=parseInt(req.query.limit) || 20
        const skip=parseInt(req.query.skip) || 0
        const id=req.params.id
        const data=await prisma.post.findFirst( {
            where:{id:Number(id)},
            include:{
                user:true,
                comments:{include:{user:true}}
            },
            take:limit,
            skip:skip
    })
        res.status(200).json({limit:limit,skip:skip,data})
    }  catch (e) {console.log(e)}
})
router.post('/posts',async(req,res)=>{
    const {content,userId}=req.body
        if(!content || !userId){
            return res.status(400)
        }
    try{ 
        const data=await prisma.post.create({
            data:{
                content,userId
            }
        })
        res.status(200).json(data)
    } catch (e){console.log(e)}
})
router.delete('/posts/:id',async(req,res)=>{
    const id=Number(req.params.id)
    try{
        const comment=await findCommentByPostId(id)
        if(comment){
            await prisma.comment.deleteMany({
                where:{postId:id}
            })
    
        }
        const post=await findPostbypostId(id)
        if(post){
            await prisma.post.delete({
                where:{id:id}
            })
            return res.sendStatus(204)
        }
        res.sendStatus(400)
    } catch(e){console.log(e)}
})
router.delete("/comments/:id",async(req,res)=>{
    const id=Number(req.params.id)
    try{
        const comment=findCommentbycommentId(id)
    if(comment){
        await prisma.comment.delete({where:{
            id:id
        }})
        return res.sendStatus(204)
    }
    res.sendStatus(400)
    } catch(e){
        console.log(e)
    }
})
export { router as postRouter };
