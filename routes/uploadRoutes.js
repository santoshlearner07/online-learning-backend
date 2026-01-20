const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pics',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });


router.post('/upload-profile', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file.path; 
        
        const user = await User.findByIdAndUpdate(
            req.user.id, 
            { profileImagePath: imageUrl }, 
            { new: true }
        );
        
        res.json({ imageUrl, user });
    } catch (err) {
        res.status(500).json({ msg: "Upload failed" });
    }
});