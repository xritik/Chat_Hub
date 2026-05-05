require('dotenv').config();

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
let clients = {}; // userId -> ws

wss.on("connection", (ws) => {
    console.log("✅ New WebSocket connection");

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // 🔥 1. Register user
            if (data.type === "register") {
                clients[data.userId] = ws;
                ws.userId = data.userId; // attach for cleanup
                console.log(`🟢 User connected: ${data.userId}`);
                return;
            }

            const { chatId, sender, receiverId, message: text } = data;

            // 🔥 2. Save message
            const chat = await Chat.findById(chatId);
            if (!chat) return;

            const newMessage = {
                sender,
                message: text,
                timestamp: new Date(),
            };

            chat.messages.push(newMessage);
            await chat.save();

            const payload = JSON.stringify({
                chatId,
                sender,
                message: text,
                timestamp: newMessage.timestamp
            });

            // 🔥 3. Send to RECEIVER
            const receiverWs = clients[receiverId];
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                receiverWs.send(payload);
            }

            // 🔥 4. ALSO send to SENDER (CRITICAL FIX)
            const senderWs = clients[sender];
            if (senderWs && senderWs.readyState === WebSocket.OPEN) {
                senderWs.send(payload);
            }

        } catch (err) {
            console.error("❌ Error:", err);
        }
    });

    // 🔥 5. Clean up on disconnect
    ws.on("close", () => {
        if (ws.userId) {
            delete clients[ws.userId];
            console.log(`❌ User disconnected: ${ws.userId}`);
        }
    });
});

// 🚀 START SERVER
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});