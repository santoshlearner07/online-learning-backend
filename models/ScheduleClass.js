const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    subject: { type: String, required: true },
    startTime: { type: Date, required: true }, // e.g., 2026-01-10T10:00:00Z
    endTime: { type: Date, required: true },
    meetingLink: { type: String, default: '' },
    status: {
        type: String,
        enum: ['UPCOMING', 'COMPLETED', 'CANCELLED'],
        default: 'UPCOMING'
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);