import mongoose from "mongoose";
import { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt"

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
        required:true
     },
     refreshedToken :{
        type:String
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
    await bcrypt.compare(password,this.password)
}
userSchema.meehods.generateAccessToken = function (){
    return jwt.sign({
        _id:this.id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn :process.env.ACCESS_TOKEN_EXPIRY
    })
    
}
userSchema.meehods.generateRefreshToken = function (){
    return jwt.sign({
        _id:this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn :process.env.REFRESH_TOKEN_EXPIRY
    })

}

export const User = mongoose.model("User",userSchema)