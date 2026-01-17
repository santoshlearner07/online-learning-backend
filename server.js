const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the DB connection function
const userRoutes = require('./routes/userRoutes'); // Import the router
const uploadRoutes = require('./routes/uploadRoutes')
const adminRoutes = require('./routes/adminRoutes')
const teacherRoutes = require('./routes/teacherRoutes')
connectDB();

const app = express();
const corsOptions = {
    origin: [
        "https://itb-tution.vercel.app", 
        "http://localhost:5173"          
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api', userRoutes);
app.use('/api', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
); 