const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the DB connection function
const userRoutes = require('./routes/userRoutes'); // Import the router
const uploadRoutes = require('./routes/uploadRoutes')
const adminRoutes = require('./routes/adminRoutes')
const teacherRoutes = require('./routes/teacherRoutes')
connectDB();

const app = express();
app.use(cors());
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