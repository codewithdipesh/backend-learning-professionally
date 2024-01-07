import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String,//cloudinary
        required:true
    },
    thumbnail:{
        type:String,//cloudinary
        required:true
    },
    Owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    tittle:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,//cloudinary
        required:true
    },
    views:{
        type:Number,
        deafult: 0
    },
    isPublished:{
        type:Boolean,
        default:true
    }
     
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video",videoSchema)