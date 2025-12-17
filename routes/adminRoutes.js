const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/AdminModal')
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expires in 1 day
    });
};

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber, adminAddress, country, adminAge } = req.body;

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
            firstName, lastName, email, password: hashedPassword, phoneNumber, adminAddress, country, adminAge, role: 'admin'
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

// router.get('/profile', protect, async (req, res) => {
//     // req.admin is populated by the 'protect' middleware
//     const admin = await admin.findById(req.admin._id).select('-password');

//     if (admin) {
//         // Send the admin object, which includes the profileImage path
//         res.json(admin);
//     } else {
//         res.status(404).json({ msg: 'admin not found' });
//     }
// });

// router.put is used for updating existing data
// router.put('/profile', protect, async (req, res) => {
//     try {
//         // req.admin._id comes from your 'protect' middleware
//         const admin = await admin.findById(req.admin._id);

//         if (admin) {
//             // Used the || operator to keep the old value if the new one isn't sent
//             admin.firstName = req.body.firstName || admin.firstName;
//             admin.lastName = req.body.lastName || admin.lastName;
//             admin.email = req.body.email || admin.email;
//             admin.adminAddress = req.body.address || admin.adminAddress;
//             admin.phoneNumber = req.body.number || admin.phoneNumber;
//             admin.country = req.body.country || admin.country;
//             admin.adminAge = req.body.age || admin.adminAge;

//             // If the admin changed their password 
//             if (req.body.password) {
//                 admin.password = req.body.password;
//             }

//             const updatedadmin = await admin.save();

//             // Send back the updated admin data (matching your login response structure)
//             res.json({
//                 _id: updatedadmin._id,
//                 firstName: updatedadmin.firstName,
//                 lastName: updatedadmin.lastName,
//                 email: updatedadmin.email,
//                 address: updatedadmin.adminAddress,
//                 number: updatedadmin.phoneNumber,
//                 country: updatedadmin.country,
//                 age: updatedadmin.adminAge,
//                 // You don't necessarily need to generate a new token 
//                 // unless you want to refresh the session
//                 token: req.headers.authorization?.split(' ')[1],
//             });
//         } else {
//             res.status(404).json({ msg: 'admin not found' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ msg: 'Server error during profile update' });
//     }
// });

module.exports = router; 