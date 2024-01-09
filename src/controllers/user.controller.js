import ApiError from "../utils/ApiError.js"
import {asynchandler} from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asynchandler( async(req,res)=>{
    //get user details from frontend
    //validation
    //already exists:username,email
    //check for avatar
    //upload to cloudinary,avatar
    //user object creation - create entry in db
    //remove password and refresh token from response
    //check for user creation
    //return response if yes
    
    const {fullName,password,email,username} = req.body

    if(
         [fullName,password,email,username].some((field)=>
         field?.trim() === "")
    ){
       throw new ApiError(400,"All fields Required!!!")
    }

    const ExistedUser = User.findOne({
        $or:[{ username },{ email }]
    })
    
    if(ExistedUser){
        throw new ApiError(409,"Username or Email already Existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is Required!!!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar){
        throw new ApiError(400,"avatar is Required!!!")
    }
    const user = await User.create({
        fullName,
        password,
        avatar : avatar.url,
        coverImage :coverImage?.url || "",
        email,
        username : username.toLowerCase()

    })
    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createduser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createduser,"User Registered Successfully")
    )

})