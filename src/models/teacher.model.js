import mongoose from "mongoose";
import User from "./user.model.js";

const teacherSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    classes: [{
        type: String
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    department: {
        type: String
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true
    }
});

const Teacher = User.discriminator('Teacher', teacherSchema);

export default Teacher;

