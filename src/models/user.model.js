import mongoose from "mongoose";

const options = {discriminatorKey: "role", timestamps: true };

const userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    password:{
        type: String,
        required: true,
    },
    phoneNumber:{
        type: String,
        required: true
    },
},options);

const User = mongoose.model('User', userSchema);

export default User;