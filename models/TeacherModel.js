const mongoose = require('mongoose');
const TeacherSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    subject: { type: String },
    experience: { type: Number },
    qualification: { type: String },
    phoneNumber: { type: Number },
    password: { type: String },
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    role: { type: String, default: 'teacher' }, 
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', TeacherSchema);