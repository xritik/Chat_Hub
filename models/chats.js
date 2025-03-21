const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    users: {
        type: [String], // Array of usernames involved in the chat
        required: true,
        validate: {
            validator: (array) => array.length === 2,
            message: 'A chat must involve exactly two users.',
        },
    },
    messages: [
        {
            sender: {
                type: String, // Username of the sender
                required: true,
            },
            message: {
                type: String, // Content of the message
                required: true,
            },
            timestamp: {
                type: Date, // Timestamp of when the message was sent
                default: Date.now,
            },
        },
    ],
}, { timestamps: true }); // Automatically adds `createdAt` and `updatedAt` fields

const Chat = mongoose.model('Chat', chatSchema);
chatSchema.index({ users: 1 });
(async () => {
    await Chat.syncIndexes();
})();


module.exports = Chat;