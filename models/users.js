const mongoose = require('mongoose');


// Define a User Schema and Model
const userSchema = new mongoose.Schema({
    fullname: String,
    gender: String,
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

module.exports = User;