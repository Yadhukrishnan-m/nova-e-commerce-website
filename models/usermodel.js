const mongoose=require("mongoose")
const userSchema=mongoose.Schema({
    name:{type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
       
    },
    password:{
        type:String,
        
    },
    is_active:{
        type:Number,
        required:true,
        default:1
    }
});

module.exports= mongoose.model('User',userSchema); 
