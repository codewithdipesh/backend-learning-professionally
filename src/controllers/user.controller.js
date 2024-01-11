import ApiError from "../utils/ApiError.js"
import {asynchandler} from "../utils/asynchandler.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const generateRefreshAndAccessToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const AccessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()

        user.refreshToken = await RefreshToken;//promise wasted 3 hrs for this bug
        await user.save({validateBeforeSave:false})

        console.log(user)

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
