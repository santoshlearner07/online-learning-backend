// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
    },
    userAddress: {
        type: String,
    },
    country: {
        type: String,
    },
    profileImagePath: {
        type: String,
        default: '/uploads/default_profile.png'
    },
    userAge: {
        type: Number,
    },
    role: {
        type: String,
    },
    subject: {
        type: String,
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    demoStatus: {
        type: String,
        enum: ['PENDING', 'SCHEDULED', 'ACCEPTED', 'ALLOCATED', 'COMPLETED'],
        default: 'PENDING'
    },
    demoSlot: {
        type: Date,
        default: null
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    isPaid: { type: Boolean, default: false },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'AWAITING_VERIFICATION', 'PAID', 'REJECTED'],
        default: 'PENDING'
    },
    paymentDate: { type: Date },
    paymentReference: { type: String },
}, {
    timestamps: true
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', UserSchema);

module.exports = User; 