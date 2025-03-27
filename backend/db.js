const mongoose = require('mongoose');

const mongoURL = 'mongodb://localhost:27017/mydb'

mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Connected to mongoDB server...');
})

db.on('error', (err) => {
    console.error('MongoDB connection Error:- ', err);
});

db.on('disconnected', () => {
    console.log('Disconnected to mongoDB server..')
});

module.exports = db;