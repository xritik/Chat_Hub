const mongoose = require('mongoose');

const mongoURL = 'mongodb://localhost:27017/mydb';

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Connected to MongoDB server')
});

db.on('error', (err) => {
    console.error('MongoDB connection error:- ', err)
});

db.on('disconnected', () => {
    console.log('MongoDB server disconnected')
})

module.exports = db;

// sudo systemctl stop mongod
// sudo systemctl start mongod