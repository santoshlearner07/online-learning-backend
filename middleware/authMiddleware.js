
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path to your User model
const Admin = require('../models/AdminModal');
const Teacher = require('../models/TeacherModel');
 
const protect = async (req, res, next) => {
    
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const teacher = await Teacher.findById(decoded.id).select('-password');
                const student = await User.findById(decoded.id).select('-password');
            req.user = teacher || student;
            req.user = await Teacher.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ msg: 'User not found in database' });
            }

            next();
        } catch (error) {
            res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

const protectAdmin = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // ⭐️ IMPORTANT: If you are logged in as an Admin, 
            // you must search the Admin collection here!
            req.user = await Admin.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ msg: 'Admin account not found' });
            }
            next();
        } catch (error) {
            res.status(401).json({ msg: 'Token failed' });
        }
    }
};

const admin = (req, res, next) => {
    if (req.user.role === 'admin') {
        next(); // User is admin, proceed to the next function
    } else {
        res.status(403).json({ msg: 'Not authorized as an admin' });
    }
};

module.exports = { protect,admin,protectAdmin }; 