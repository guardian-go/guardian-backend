import mongoose from "mongoose";
import User from "./user.model.js";

const parentSchema = new mongoose.Schema({
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    address: {
        type: String
    },
    photo: {
        type: String // URL or base64 string for parent photo
    },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    }
});

const Parent = User.discriminator('Parent', parentSchema);

export default Parent;

