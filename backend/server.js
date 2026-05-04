const express = require('express');
const cors = require('cors');
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 8080;
require('./db');

const Chat = require('./models/chats'); // IMPORTANT

const corsOptions = {
    origin: '*',
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
const loginRoutes = require('./routes/loginRoutes');
app.use('/login', loginRoutes);

const signupRoutes = require('./routes/signupRoutes');
app.use('/signup', signupRoutes);

const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/chat', chatRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);

// 🔥 CREATE HTTP SERVER
const server = http.createServer(app);

// 🔥 WEBSOCKET SERVER
const wss = new WebSocket.Server({ server });

// Store connected clients
let clients = [];

wss.on("connection", (ws) => {
    console.log("✅ New WebSocket connection");

    // Store client
    clients.push(ws);

    // Receive message from frontend
    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // Expected data:
            // { chatId, sender, message }

            const { chatId, sender, message: text } = data;

            // 🔥 Save to MongoDB
            const chat = await Chat.findById(chatId);
            if (!chat) return;

            const newMessage = {
                sender,
                message: text,
                timestamp: new Date(),
            };

            chat.messages.push(newMessage);
            await chat.save();

            // 🔥 Broadcast ONLY to relevant users (basic version = all)
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        chatId: chatId,              // ✅ VERY IMPORTANT
                        sender: newMessage.sender,
                        message: newMessage.message,
                        timestamp: newMessage.timestamp
                    }));
                }
            });

        } catch (err) {
            console.error("❌ Error:", err);
        }
    });

    ws.on("close", () => {
        clients = clients.filter(client => client !== ws);
        console.log("❌ Client disconnected");
    });
});

// 🚀 START SERVER
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});