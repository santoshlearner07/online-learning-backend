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
}, {
    timestamps: true
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model('User', UserSchema);

module.exports = User;