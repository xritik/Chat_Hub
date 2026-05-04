const mongoose = require('mongoose');

const mongoURL = process.env.MONGO_URI; // 🔥 from env

if (!mongoURL) {
    console.error("❌ MONGO_URI not defined");
    process.exit(1);
}

mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('connected', () => {
    console.log('✅ Connected to MongoDB Atlas');
});

db.on('error', (err) => {
    console.error('❌ MongoDB connection Error:', err);
});

db.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

module.exports = db;