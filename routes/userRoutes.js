const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed
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
        const { firstName, lastName, email, password, phoneNumber, userAddress, country, userAge } = req.body;

        if (!firstName || !email) {
            return res.status(400).json({ msg: 'Please enter all required fields.' });
        }

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({
            firstName, lastName, email, password: hashedPassword, phoneNumber, userAddress, country, userAge, role: 'student'
        });
        await user.save();

        res.status(201).json({
            msg: 'User registered successfully',
            data: user
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
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
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ msg: 'Invalid email or password' });
    }
})

router.get('/profile', protect, async (req, res) => {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
        // Send the user object, which includes the profileImage path
        res.json(user);
    } else {
        res.status(404).json({ msg: 'User not found' });
    }
});

// router.put is used for updating existing data
router.put('/profile', protect, async (req, res) => {
    try {
        // req.user._id comes from your 'protect' middleware
        const user = await User.findById(req.user._id);

        if (user) {
            // Used the || operator to keep the old value if the new one isn't sent
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.email = req.body.email || user.email;
            user.userAddress = req.body.address || user.userAddress;
            user.phoneNumber = req.body.number || user.phoneNumber;
            user.country = req.body.country || user.country;
            user.userAge = req.body.age || user.userAge;

            // If the user changed their password 
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            // Send back the updated user data (matching your login response structure)
            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                address: updatedUser.userAddress,
                number: updatedUser.phoneNumber,
                country: updatedUser.country,
                age: updatedUser.userAge,
                // You don't necessarily need to generate a new token 
                // unless you want to refresh the session
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

module.exports = router; 