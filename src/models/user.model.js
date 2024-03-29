import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const date = Date.now()

const userSchema = new mongoose.Schema({
     email :{
        type : String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,     
     },
     password :{
        type : String,
        required:[,"Password is required"],
        trim:true,
     },
     username :{
        type : String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
     },
     fullName :{
        type : String,
        required:true,
        trim:true,
        index:true
     },
     avatar :{
        type : String, //cloudinary
        required:true
     },
     coverImage :{
        type : String, //cloudinary
     },
     refreshToken :{
        type:String,
        default:null
     },
     watchHistory :[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }

     ]
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordCorrect = async function
(password){
     return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = async function (){
    return await jwt.sign({
        _id:this.id,
        email:this.email,
        username:this.username,
        fullName:this.fullName,
        date

    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn :process.env.ACCESS_TOKEN_EXPIRY
    })
    
}
userSchema.methods.generateRefreshToken = async function (){
    return  await jwt.sign({
        _id:this.id,
        date
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn :process.env.REFRESH_TOKEN_EXPIRY
    })

}

export const User = mongoose.model("User",userSchema)