const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
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
    adminAddress: {
        type: String,
    },
    country: {
        type: String,
    },
    profileImagePath: {
        type: String,
        default: '/uploads/default_profile.png'
    },
    adminAge: {
        type: Number,
    },
    role: {
        type: String,
    }
}, {
    timestamps: true
});

AdminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin; 