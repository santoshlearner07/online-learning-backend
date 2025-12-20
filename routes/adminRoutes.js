const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/AdminModal')
const bcrypt = require('bcryptjs');
const { admin, protectAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

router.post('/register', async (req, res) => {
    try {
        // const { firstName, lastName, email, password, phoneNumber, adminAddress, country, adminAge,role } = req.body;

        const {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            userAddress, // Changed from adminAddress to match your frontend
            country,
            userAge,      // Changed from adminAge to match your frontend
            role
        } = req.body;

        // ... existing validation and hashing ...


        if (!firstName || !email) {
            return res.status(400).json({ msg: 'Please enter all required fields.' });
        }
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ msg: 'admin with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        admin = new Admin({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            adminAddress: userAddress, // Map the frontend 'userAddress' to backend 'adminAddress'
            country,
            adminAge: userAge,         // Map the frontend 'userAge' to backend 'adminAge'
            role: role || 'admin'
        });
        await admin.save();

        res.status(201).json({
            msg: 'Admin Registered Successfully',
            data: admin
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    console.log(req.body)
    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            firstName: admin.firstName,
            email: admin.email,
            lastName: admin.lastName,
            address: admin.adminAddress,
            number: admin.phoneNumber,
            country: admin.country,
            age: admin.adminAge,
            token: generateToken(admin._id),
        });
    } else {
        res.status(401).json({ msg: 'Invalid email or password' });
    }
})

router.get('/alluser', protectAdmin,admin, async (req, res) => {
    try {

        const users = await User.find({}).select('-password')
        if (users) {
            res.json(users)
        } else {
            res.status(404).json({ msg: "No user found" });
        }
    } catch (error) {
        console.error('Error fetching users', error)
        res.status(500).json({ msg: "Server error" })
    }
}) 

router.get('/alladmin',async(req,res)=>{
    try {
        const admins = await Admin.find({}).select('-password')
        if (admins) {
            res.json(admins)
        } else {
            res.status(404).json({ msg: "No user found" });
        }
    } catch (error) {
        console.error('Error fetching users', error)
        res.status(500).json({ msg: "Server error" })
    }
})

module.exports = router; 