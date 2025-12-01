import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
        required: false // parent will be attached later when they claim the student
    },
    relation: {
        type: String, // e.g., "Mother", "Father", "Guardian"
        required: false
    },
    grade: {
        type: String
    },
    photo: {
        type: String // URL to photo
    },
    dateOfBirth: {
        type: Date
    },
    address: {
        type: String
    },
    primaryTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false
    },
    isReleased: {
        type: Boolean,
        default: false
    },
    releasedAt: {
        type: Date
    },
    releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;

