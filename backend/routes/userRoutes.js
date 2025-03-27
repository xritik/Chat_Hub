const express = require('express');
const router = express.Router();
const User = require('../models/users');

router.get('/', async (req, res) => {
    try{
        const allUsers = await User.find({}, { username: 1, fullname: 1, gender: 1, _id: 0 });
        res.status(200).json({users: allUsers});
    } catch (error){
        console.error('Error fetching user data:', error);
        res.status(500).json({ message: 'An error accurred while fetching user data' })
    }
});

module.exports = router;