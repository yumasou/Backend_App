import jwt from "jsonwebtoken"
// import prisma from "../prismaClient.js"
const auth= async (req,res,next)=>{
const Authorization=req.headers.authorization
if(!Authorization){
    return res.setStatus(401)
}
const token=Authorization && Authorization.split(" ")[1]
const user=jwt.verify(token,process.env.JWT_SECRECT)
res.locals.user=user
next()
}
export {auth}