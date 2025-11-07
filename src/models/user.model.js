import mongoose from "mongoose";

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
    role:{
        type: String,
        required: true,
        enum: ['supervisor', 'parent', 'teacher'],
        default: 'parent',
    }
},{timestamps: true});

const User = mongoose.model('User', userSchema);

module.exports = User;