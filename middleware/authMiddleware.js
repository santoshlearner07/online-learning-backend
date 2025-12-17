// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path to your User model

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            //  Get token from header (e.g., "Bearer XXX.YYY.ZZZ")
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            //  Find user in database and attach to request object
            // select everything EXCEPT the password
            req.user = await User.findById(decoded.id).select('-password'); 

            // Move to the next middleware/route handler
            next();

        } catch (error) {
            console.error('JWT verification failed:', error);
            res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

module.exports = { protect };