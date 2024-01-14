import ApiError from "../utils/ApiError.js"
import {asynchandler} from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  Jwt  from "jsonwebtoken";

const generateRefreshAndAccessToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const AccessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()

        user.refreshToken = await RefreshToken;//promise wasted 3 hrs for this bug
        await user.save({validateBeforeSave:false})

        // console.log(user)

        // console.log(AccessToken,RefreshToken)
        return {AccessToken,RefreshToken}
    }catch(error){
        throw new ApiError(500,"Something went Wrong while generating refresh and access token")
    }
}


export const registerUser = asynchandler( async(req,res)=>{
    //get user details from frontend
    //validation s
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

    const ExistedUser = await User.findOne({
        $or:[{ username },{ email }]
    })
    
    if(ExistedUser){
        throw new ApiError(409,"Username or Email already Existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //if there is no coverImage
   
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is Required!!!")
    }
    // console.log(avatarLocalPath);

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
    // console.log("data created")
    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // console.log("createdUser created")
    if(!createduser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createduser,"User Registered Successfully")
    )

})


export const loginUser = asynchandler(async(req,res)=>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User Does'nt Exists")
    }

   const isPasswordValid =  await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(401,"Invalid Credentials")
   }
   
   const{AccessToken,RefreshToken} = await generateRefreshAndAccessToken(user._id);
   const AccessTokenvalue = await AccessToken
   const RefreshTokenValue = await RefreshToken
   //two option, update the user object or one more databse query
      // 2.database query
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",AccessTokenvalue,options)
    .cookie("refreshToken",RefreshTokenValue,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                AccessToken:AccessTokenvalue ,
                RefreshToken:RefreshTokenValue
            },
            "User logged In Successfully"
        )
    )

})


export const LogOutUser = asynchandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
    {
      $set:
      {
        refreshToken:undefined
      } 
    },
    {
      new:true
    }
    )
    
    const options = {
        httpOnly:true,
        secure:true
    }
    
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged Out")
    )
})

export const refreshAccessToken = asynchandler(async(req,res)=>{

    const incomingrefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingrefreshToken) {
       throw new ApiError(401,"Unauthorized Acess!")
    }
    // console.log(incomingrefreshToken);
    try {
        const Decryptedtoken = Jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET);
        // console.log(Decryptedtoken);
        const user = await User.findById(Decryptedtoken?._id);
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
        if(user.refreshToken !== incomingrefreshToken){
            throw new ApiError(401,"Refresh Token Expired!!")
        }
        const {AccessToken,RefreshToken} = await generateRefreshAndAccessToken(user._id)
        const accessTokenvalue = await AccessToken;
        const refreshTokenvalue = await RefreshToken;
        const options = {
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessTokenvalue,options)
        .cookie("refreshToken",refreshTokenvalue,options)
        .json(
            new ApiResponse(
                200,
                {accessToken : accessTokenvalue,refreshToken:refreshTokenvalue},
                "Access token refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Inavalid refresh token")
    }




})  

export const changeCurrentPassword = asynchandler(async(req,res)=>{
    const {currentPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Ivalid current password")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed Succesfully"))
})

export const getCurrentUser = asynchandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"User fetched Successfully"))
})

export const updateAccountDetails = asynchandler(async(req,res)=>{
    // get details
    //find  the user using req.user.id
    // update and save
    
    const {fullName,username} = req.body

    if(!fullName || !username){
        throw new ApiError(400,"All fields are required ");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                username
            }
        },
        {
            new:true
        }
        ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updated Successfully!!!"))
    

})
// avatar coverimage update
export const updateAvatar = asynchandler(async(req,res)=>{
    //get the avatar from files
    //cloudinary get string
    //find and update
    const avatarlocalpath = req.files?.path;
    
    if(!avatarlocalpath){
        throw new ApiError(400,"Avatar is Required !!!");
    }
    const avatar = await uploadOnCloudinary(avatarlocalpath);
    if(!avatar.url){
        throw new ApiError(400,"Something Went wrong uploading the image")
    }
    const user = User.findByIdAndUpdate(
        req.user,
        {
            $set:{
                avatar : avatar.url
            }
        },{
            new:true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Updated Successfully")
    )


})

export const updateCoverImage = asynchandler(async(req,res)=>{
    //get the avatar from files
    //cloudinary get string
    //find and update
    const coverImagelocalpath = req.files?.path;
    
    if(!coverImagelocalpath){
        throw new ApiError(400,"CoverImage is Required !!!");
    }
    const coverImage = await uploadOnCloudinary(coverImagelocalpath);
    if(!coverImage.url){
        throw new ApiError(400,"Something Went wrong uploading the image")
    }
    const user = User.findByIdAndUpdate(
        req.user,
        {
            $set:{
                coverImage : coverImage.url
            }
        },{
            new:true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Updated Successfully")
    )


})

export const getUserChannelProfile = asynchandler(async(req,res)=>{
    const {username} = req.body
    if(!username?.trim()){
        throw new ApiError(400,"Username is required!!!");
    }
    const channel = await User.aggregate([
        {
            $match:
            {
                username:username?.toLowerCase()
            }
        },
        {
           $lookup:
           {
              from: "subscriptions", // in DATABASE ALL SCHEMAS ARE SAVED IN all owercase and plural 
              localField:"_id",
              foreignField:"channel",
              as:"subcribers"
           }
        },
        {
           $lookup:
           {
              from: "subscriptions", // in DATABASE ALL SCHEMAS ARE SAVED IN all owercase and plural 
              localField:"_id",
              foreignField:"subscriber",
              as:"subcribedTo"
           }
        },
        {
            $addFields:
            {
                subscribersCount : {
                    $size:"$subcribers"
                },
                channelSubscribedToCount : {
                    $size:"$subcribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:
            {
                fullName:1,
                username:1,
                avatar:1,
                coverImage:1,
                isSubscribed:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
            }
        }
    ])
    
    if(!channel?.length){
        throw new ApiError(404,"channel doesn't exists")

    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})