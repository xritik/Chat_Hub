const express = require('express');
const router = express.Router();
const User = require('../models/users');

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists in the database
    const user = await User.findOne({username, password });

    if (user) {
        res.status(200).json({ message: 'Login successful'});
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

module.exports = router;