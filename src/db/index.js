import mongoose from "mongoose";

import {DB_NAME} from "../constants.js"

const options = {
    // Set the write concern to 'majority'
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  };

export const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,options);
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        // console.log(connectionInstance)
    }catch(error){
        console.log("MONGODB connection Failed",error)
        process.exit(1);
    }
}