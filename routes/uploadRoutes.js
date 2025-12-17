// routes/uploadRoutes.js

const express = require('express');
const multer = require('multer');
const router = express.Router();
const User = require('../models/User'); // ⭐️ Import your User model
const { protect } = require('../middleware/authMiddleware');

// ... (Multer storage and upload configuration remains the same)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});
// ...
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
}).single('profileImage'); 

router.post('/upload', protect, (req, res) => {
    const userId = req.user._id;
    
    upload(req, res, async function (err) { // ⭐️ Add 'async' keyword here
        if (err || !req.file) {
             // Handle errors or missing file
             return res.status(400).json({ msg: 'File upload failed or no file selected.' });
        }
        
        // 1. Define the path where the image can be accessed publicly
        const imagePath = `/uploads/${req.file.filename}`;

        try {
            if (!userId) {
                return res.status(400).json({ msg: 'User ID is missing from the request.' });
            }
            
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { profileImagePath: imagePath }, // ⭐️ Save the path to the user document
                { new: true, runValidators: true } // Return the updated document
            );

            if (!updatedUser) {
                 return res.status(404).json({ msg: 'User not found in database.' });
            }

            // Success response
            res.status(200).json({ 
                msg: 'Image uploaded and path saved successfully', 
                filePath: imagePath,
                user: updatedUser
            });

        } catch (dbError) {
             console.error('Database Update Error:', dbError.message);
             // Delete the file we just saved if the DB update fails
             res.status(500).json({ msg: 'Server error during database update.' });
        }
    });
});


module.exports = router;

