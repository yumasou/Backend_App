import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"

const prisma=new PrismaClient()

async function Hashpassword(password) {
const slat=10
return(await bcrypt.hash(password,slat))
}

export const UserSeeder=async ()=> {
    const hashedpassword=await Hashpassword("password")
    console.log("user seeding started...")
    for(let i=0;i<10;i++){
        const FirstName=faker.person.firstName()
        const LastName=faker.person.lastName()
        const FullName=`${FirstName} ${LastName}`
        const username=`${FirstName}${LastName[0]}`.toLocaleLowerCase()
        const email=faker.internet.email()
        const bio=faker.person.bio()
        await prisma.user.upsert(
            {where:{    username   },
            update:{},
            create:{
                name:FullName,username,email,bio,password:hashedpassword
            }
        }
        )

    }
    console.log("user seeding done...")
}
