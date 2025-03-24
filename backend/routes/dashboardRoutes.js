const express = require('express');
const router = express.Router();
const User = require('../models/users');

// Dashboard Route to Fetch Logged-In User's Data
router.get('/', async (req, res) => {
    const loginUser = req.headers['login-user']; // Extract username from request headers
    if (!loginUser) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    try {
        const user = await User.findOne({ username: loginUser });

        if (user) {
            const allUsers = await User.find({}, { username: 1, fullname: 1, gender: 1, _id: 0 }); // Fetch all users (only username)
            res.status(200).json({ 
                fullname: user.fullname, 
                gender: user.gender,
                users: allUsers, // Send all registered users
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: 'An error occurred while fetching user data' });
    }
});

module.exports = router;