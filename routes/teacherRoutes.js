const express = require('express');
const router = express.Router();
const Teacher = require('../models/TeacherModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

router.post('/register', async (req, res) => {
    try {
        const { firstName, email, subject, experience, qualification, phoneNumber } = req.body;

        if (!firstName || !email) {
            return res.status(400).json({ msg: 'Full Name and Email are required.' });
        }

        let teacherExists = await Teacher.findOne({ email });
        if (teacherExists) {
            return res.status(400).json({ msg: 'Teacher with this email already exists.' });
        }

        // 3. Generate and HASH password
        const namePart = firstName.substring(0, 4);
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const generatedPassword = `${namePart}${experience}@ITB${randomPart}`;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        const teacher = new Teacher({
            firstName,
            email,
            subject,
            experience,
            qualification,
            phoneNumber,
            password: hashedPassword // Save the HASH, not the plain text
        });

        await teacher.save();

        res.status(201).json({
            msg: 'Teacher registered successfully',
            tempPassword: generatedPassword, // Send this back so you can show the admin the password
            data: teacher
        });

    } catch (err) {
        console.error("Backend Error:", err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.get('/get-teachers',async(req,res)=>{
    try {
        const teachers = await Teacher.find({}).select('-password')
        if (teachers) {
            res.json(teachers)
        } else {
            res.status(404).json({ msg: "No user found" });
        }
    } catch (error) {
        console.error('Error fetching users', error)
        res.status(500).json({ msg: "Server error" })
    }
})

module.exports = router;