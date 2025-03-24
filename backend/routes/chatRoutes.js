const express = require('express');
const router = express.Router();
const Chat = require('../models/chats');

router.post('/start', async (req, res) => {
    const { loginUser, userToChat } = req.body;

    // Normalize the users array
    const sortedUsers = [loginUser, userToChat].sort();

    try {
        // Find or create the chat
        let chat = await Chat.findOne({ users: sortedUsers });
        if (chat === null) {
            // Create a new chat if it doesn't exist
            chat = new Chat({
                users: sortedUsers,
                messages: [],
            });
            await chat.save();
        }
        
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Error creating or retrieving chat' });
    }
});



router.post('/send', async (req, res) => {
    const { chatId, sender, message } = req.body;

    try {
        const chat = await Chat.findById(chatId);
        chat.messages.push({ sender, message, timestamp: new Date() });
        await chat.save();

        res.status(200).json({ success: true, message: 'Message sent!' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending message' });
    }
});

router.get('/:chatId', async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.status(200).json(chat.messages);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving messages' });
    }
});

module.exports = router;