const express = require('express');
const router = express.Router();
const Teacher = require('../models/TeacherModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const ScheduleClass = require('../models/ScheduleClass');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', 
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
            password: hashedPassword 
        });

        await teacher.save();

        res.status(201).json({
            msg: 'Teacher registered successfully',
            tempPassword: generatedPassword, 
            data: teacher
        });

    } catch (err) {
        console.error("Backend Error:", err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.get('/get-teachers', async (req, res) => {
    try {
        const teachers = await Teacher.find({}).select('-password')
        if (teachers) {
            res.json(teachers)
        } else {
            res.status(404).json({ msg: "No Teacher found" });
        }
    } catch (error) {
        console.error('Error fetching users', error)
        res.status(500).json({ msg: "Server error" })
    }
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });

    if (teacher && (await bcrypt.compare(password, teacher.password))) {
        res.json({
            _id: teacher._id,
            firstName: teacher.firstName,
            email: teacher.email,
            role: 'teacher',
            token: generateToken(teacher._id),
        });
    } else {
        res.status(401).json({ msg: 'Invalid email or password' });
    }
});

router.get('/dashboard-data', protect, async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ msg: "User data missing from request" });
        }

        const teacherId = req.user._id;
        const teacherInfo = await Teacher.findById(teacherId).populate('students');
        
        if (!teacherInfo) {
            return res.status(404).json({ msg: "Teacher not found" });
        }

        const upcomingClasses = await ScheduleClass.find({
            teacherId: req.user._id,
            startTime: { $gte: new Date() }
        }).populate('studentId');

        res.json({
            profile: {
                firstName: teacherInfo.firstName,
                email: teacherInfo.email,
                subject: teacherInfo.subject,
                qualification: teacherInfo.qualification,
                experience: teacherInfo.experience
            },
            students: teacherInfo.students || [],
            classes: upcomingClasses || []
        });
    } catch (error) {
        console.error("DETAILED_ERROR:", error); // 👈 This shows the real error in terminal
        res.status(500).json({ msg: "Server Error", error: error.message });
    }
});

module.exports = router;