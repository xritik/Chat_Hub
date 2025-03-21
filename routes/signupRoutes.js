const express = require('express');
const router = express.Router();
const User = require('../models/users');

router.post('/', async (req, res) => {
    const {fullname, gender, username, password} = req.body;

    // Check if the user exists in the database
    const user = await User.findOne({username});

    if(user){
        return res.status(401).json({message: 'User already exists, please try again'});
    }
    try {
        // Create a new user and save it to the database
        const newUser = new User({fullname, gender, username, password });
        await newUser.save();
        res.status(201).json({ message: `${fullname} added successfully` });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: 'An error occurred while creating the user' });
    }
});

module.exports = router;