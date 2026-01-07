const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/AdminModal')
const bcrypt = require('bcryptjs');
const { admin, protectAdmin, protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Teacher = require('../models/TeacherModel');
const ScheduleClass = require('../models/ScheduleClass');
const crypto = require('crypto');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', 
    });
};

router.post('/register', async (req, res) => {
    try {

        const {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            userAddress, 
            country,
            userAge,      
            role
        } = req.body;

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
            adminAddress: userAddress, 
            country,
            adminAge: userAge,         
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

router.get('/alluser', protectAdmin, admin, async (req, res) => {
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

router.get('/alladmin', async (req, res) => {
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

router.put('/allocate', protectAdmin, admin, async (req, res) => {
    const { teacherId, studentId } = req.body;
    try {
        const updateTeacher = Teacher.findByIdAndUpdate(
            teacherId,
            { $addToSet: { students: studentId } },
            { new: true }
        );

        const updateStudent = User.findByIdAndUpdate(
            studentId,
            { teacher: teacherId },
            { new: true }
        );

        await Promise.all([updateTeacher, updateStudent]);

        res.status(200).json({ msg: 'Allocation successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error during allocation' });
    }
});

router.put('/deallocate', protectAdmin, admin, async (req, res) => {
    const { teacherId, studentId } = req.body;

    try {
        const updateTeacher = Teacher.findByIdAndUpdate(
            teacherId,
            { $pull: { students: studentId } } 
        );

        const updateStudent = User.findByIdAndUpdate(
            studentId,
            { $set: { teacher: null } }
        );

        await Promise.all([updateTeacher, updateStudent]);

        res.status(200).json({ msg: 'Teacher removed successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error during deallocation' });
    }
});

router.post('/schedule-class', protect, admin, async (req, res) => {
    try {
        const { studentId, teacherId, subject, startTime, durationInMinutes } = req.body;
        if (!studentId || !teacherId || !startTime) {
            return res.status(400).json({ msg: "Please provide all required fields" });
        }

        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationInMinutes * 60000);
        const conflict = await Schedule.findOne({
            teacherId,
            $or: [
                { startTime: { $lt: end, $gte: start } }, 
                { endTime: { $gt: start, $lte: end } }    
            ]
        });

        if (conflict) {
            return res.status(400).json({ msg: "Teacher is already booked for this time slot" });
        }

        const newClass = await ScheduleClass.create({
            studentId,
            teacherId,
            subject,
            startTime: start,
            endTime: end,
        });

        res.status(201).json(newClass);

    } catch (error) {
        console.error("SCHEDULING_ERROR:", error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
});

router.post('/schedule-class-recurring', protectAdmin, admin, async (req, res) => {
    try {
        const { studentId, teacherId, subject, startTime, frequency, totalDays, durationInMinutes } = req.body;
        
        const scheduleBatch = [];
        let currentStart = new Date(startTime);
        const interval = frequency === 'daily' ? 1 : 7; 
        
        const occurrences = frequency === 'once' ? 1 : Math.ceil(totalDays / interval);

        for (let i = 0; i < occurrences; i++) {
            const start = new Date(currentStart);
            const end = new Date(start.getTime() + durationInMinutes * 60000);
            // Unique link for meeting
            const uniqueRoom = crypto.randomBytes(8).toString('hex');
            const meetingLink = `https://meet.jit.si/${subject.replace(/\s+/g, '-')}-${uniqueRoom}`;

            scheduleBatch.push({
                studentId,
                teacherId,
                subject,
                startTime: start,
                endTime: end,
                meetingLink,
                status: 'UPCOMING'
            });

            currentStart.setDate(currentStart.getDate() + interval);
        }

        await ScheduleClass.insertMany(scheduleBatch);

        res.status(201).json({ msg: `Successfully scheduled ${occurrences} classes.` });
    } catch (error) {
        console.error("RECURRING_ERROR:", error.message);
        res.status(500).json({ msg: 'Server Error', error: error.message });
    }
});

router.put('/verify-payment/:studentId', protectAdmin, admin, async (req, res) => {
    try {
        const { status } = req.body; // Expecting 'PAID' or 'REJECTED'
        const { studentId } = req.params;

        const updateFields = {
            paymentStatus: status,
            isPaid: status === 'PAID',
            // ⭐️ Record exact date and time when payment is officially confirmed
            paymentDate: status === 'PAID' ? new Date() : null 
        };

        const updatedStudent = await User.findByIdAndUpdate(
            studentId,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        res.status(200).json({ 
            msg: `Student payment status updated to ${status}`, 
            data: updatedStudent 
        });

    } catch (error) {
        console.error("Payment Verification Error:", error.message);
        res.status(500).json({ msg: "Server error during verification" });
    }
});
router.get('/payment-stats', protect, admin, async (req, res) => {
    try {
        const paidStudents = await User.find({ isPaid: true }).select('firstName lastName paymentDate subject');
        
        // Calculate total (Assuming a flat fee, e.g., £50)
        const totalRevenue = paidStudents.length * 50; 

        res.json({
            count: paidStudents.length,
            totalRevenue: `£${totalRevenue}`,
            history: paidStudents
        });
    } catch (error) {
        res.status(500).json({ msg: "Error fetching stats" });
    }
});

router.put('/allocate-demo/:studentId', protectAdmin, admin, async (req, res) => {
    try {
        const { teacherId } = req.body;
        const student = await User.findById(req.params.studentId);

        if (!student) return res.status(404).json({ msg: "Student not found" });

        // Update the student record
        student.teacher = teacherId;
        student.acceptedBy = teacherId; // Admin is effectively "accepting" on their behalf
        student.demoStatus = 'ALLOCATED'; // Distinct from 'ACCEPTED' to track Admin action
        
        await student.save();

        res.json({ msg: "Teacher allocated successfully by Admin", student });
    } catch (error) {
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router; 