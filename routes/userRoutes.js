const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 
const { sendVerificationEmail } = require('../utils/emailService');
const { protect } = require('../middleware/authMiddleware');
const ScheduleClass = require('../models/ScheduleClass');
const Teacher = require('../models/TeacherModel');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, userAddress, country, userAge, role } = req.body;

        // 1. Check if user already exists
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Generate Verification Token
        const token = crypto.randomBytes(20).toString('hex');

        // 4. Create the NEW user instance
        const user = new User({
            firstName, 
            lastName, 
            email, 
            password: hashedPassword, 
            phoneNumber, 
            userAddress, 
            country, 
            userAge, 
            role,
            verificationToken: token, // ⭐️ Assign directly here
            verificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 Hours
        });

        // 5. Save to Database
        await user.save();

        // 6. Send Email (Make sure the function variable names match)
        await sendVerificationEmail(user.email, token);

        res.status(201).json({
            msg: 'Registration successful! Please check your email to verify your account.',
            data: { id: user._id, email: user.email } // Don't send the password back!
        });

    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/verify-email/:token', async (req, res) => {
    const user = await User.findOne({
        verificationToken: req.params.token,
        verificationExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).send("Invalid or expired token.");

    user.isVerified = true;
    user.verificationToken = undefined; // Clear the token
    user.verificationExpire = undefined;
    await user.save();

    res.send("<h1>Email Verified!</h1><p>You can now log in to the dashboard.</p>");
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user.isVerified) {
    return res.status(401).json({ msg: "Please verify your email before logging in." });
}
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            firstName: user.firstName,
            email: user.email,
            lastName: user.lastName,
            address: user.userAddress,
            number: user.phoneNumber,
            country: user.country,
            age: user.userAge,
            demoStatus: user.demoStatus,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ msg: 'Invalid email or password' });
    }
})

router.put('/demo-booking', protect, async (req, res) => {
    try {
        const { demoSlot } = req.body;
        if (!demoSlot) {
            return res.status(400).json({ message: 'Please provide a demo slot' });
        }
        const user = await User.findById(req.user._id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.demoStatus !== 'PENDING' && user.demoSlot) {
            return res.status(400).json({ msg: "You already have a demo scheduled." });
        }
        user.demoSlot = new Date(demoSlot);
        user.demoStatus = 'SCHEDULED';
        user.subject = req.body.subject;
        await user.save();

        res.status(200).json({
            message: 'Demo scheduled successfully',
            demoStatus: user.demoStatus,
            demoSlot: user.demoSlot,
            subject: user.subject
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
})

router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ msg: 'User not found' });
    }
});



router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.email = req.body.email || user.email;
            user.userAddress = req.body.address || user.userAddress;
            user.phoneNumber = req.body.number || user.phoneNumber;
            user.country = req.body.country || user.country;
            user.userAge = req.body.age || user.userAge;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                address: updatedUser.userAddress,
                number: updatedUser.phoneNumber,
                country: updatedUser.country,
                age: updatedUser.userAge,
                token: req.headers.authorization?.split(' ')[1],
            });
        } else {
            res.status(404).json({ msg: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error during profile update' });
    }
});

router.get('/my-schedule', protect, async (req, res) => {
    try {
        const classes = await ScheduleClass.find({
            studentId: req.user._id,
            startTime: { $gte: new Date() },
            status: 'UPCOMING'
        })
            .populate('teacherId', 'firstName')
            .sort({ startTime: 1 });

        res.json(classes);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/submit-payment', protect, async (req, res) => {
    try {
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({ msg: "Please provide a transaction reference or name." });
        }

        const student = await User.findById(req.user._id);

        if (!student) {
            return res.status(404).json({ msg: "User not found." });
        }

        student.paymentStatus = 'AWAITING_VERIFICATION';
        student.paymentReference = reference;

        await student.save();

        res.status(200).json({
            msg: "Payment reference submitted successfully. Waiting for Admin approval.",
            status: student.paymentStatus
        });

    } catch (error) {
        console.error("Payment Submission Error:", error.message);
        res.status(500).json({ msg: "Server error during payment submission" });
    }
});

router.delete('/delete-my-account', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await Promise.all([
            ScheduleClass.deleteMany({ studentId: userId }),

            Teacher.updateMany(
                { students: userId },
                { $pull: { students: userId } }
            ),

            User.findByIdAndDelete(userId)
        ]);

        res.status(200).json({ msg: "Account and all associated data deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server Error during deletion" });
    }
});

module.exports = router; 