 //high order function


// export const asynchandler = (requestHandler)=>{
//     return (req,res,next)=>{
//        Promise.resolve( requestHandler(req,res,next)).catch((err)=>next(err));
//     }
// }



export const asynchandler = (fn) => async (req,res,next)=>{
    try{
         await fn(req,res,next);
    }catch(err){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}