import { connectDB } from "./db/index.js";
import dotenv from "dotenv"


dotenv.config({
    path:'./env'
})


connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERROR :",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`app is listening in port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!!",err)
})