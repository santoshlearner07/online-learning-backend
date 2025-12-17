// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = dotenv.config().parsed.MONGO_URI;
 
const connectDB = async () => {
    try {   
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;