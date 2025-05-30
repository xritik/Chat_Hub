const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const PORT = process.env.PORT || 8080;
require('./db');

const corsOptions = {
    origin: '*',
    // origin: 'http://192.168.1.6:3000',
    // credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
app.use(express.json());

const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

const signupRoutes = require('./routes/signupRoutes');
app.use('/signup', signupRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/chat', chatRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);




app.listen(PORT, () => console.log('Server is running at port', PORT));