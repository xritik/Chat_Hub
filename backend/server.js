require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require("http");
const WebSocket = require("ws");
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;
require('./db');

const Chat = require('./models/chats');

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/login', require('./routes/loginRoutes'));
app.use('/signup', require('./routes/signupRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/chat', require('./routes/chatRoutes'));
app.use('/users', require('./routes/userRoutes'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected users: userId -> ws
let clients = {};

wss.on("connection", (ws) => {
    console.log("New WebSocket connection");

    ws.isAlive = true;

    ws.on("pong", () => {
        ws.isAlive = true;
    });

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // ============================
            // REGISTER USER
            // ============================
            if (data.type === "register") {
                const { userId } = data;

                if (!userId) {
                    console.log("Register missing userId");
                    return;
                }

                // Close old connection if exists
                if (clients[userId] && clients[userId] !== ws) {
                    try { clients[userId].terminate(); } catch {}
                }

                clients[userId] = ws;
                ws.userId = userId;

                console.log(`Registered: ${userId}`);
                console.log("Active:", Object.keys(clients));
                return;
            }

            // ============================
            // SEND MESSAGE
            // ============================
            const { chatId, sender, receiverId, message: text } = data;

            if (!chatId || !sender || !receiverId || !text) {
                console.log("Invalid message data:", data);
                return;
            }

            const chat = await Chat.findById(chatId);
            if (!chat) {
                console.log("Chat not found:", chatId);
                return;
            }

            // Generate a unique ID for this message so the frontend can deduplicate
            const msgId = randomUUID();

            const newMessage = {
                msgId,
                sender,
                message: text,
                timestamp: new Date().toISOString(),
            };

            chat.messages.push(newMessage);
            await chat.save();

            const payload = JSON.stringify({
                msgId,
                chatId,
                sender,
                message: text,
                timestamp: newMessage.timestamp,
            });

            // ============================
            // SAFE SEND FUNCTION
            // ============================
            const sendIfOnline = (userId) => {
                const client = clients[userId];
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                    console.log(`Sent to ${userId}`);
                } else {
                    console.log(`${userId} not online`);
                }
            };

            // Send to both participants
            sendIfOnline(receiverId);
            sendIfOnline(sender);

        } catch (err) {
            console.error("WS Error:", err);
        }
    });

    // ============================
    // CLEANUP ON DISCONNECT
    // ============================
    ws.on("close", () => {
        if (ws.userId && clients[ws.userId] === ws) {
            delete clients[ws.userId];
            console.log(`Disconnected: ${ws.userId}`);
            console.log("Active:", Object.keys(clients));
        }
    });

    ws.on("error", (err) => {
        console.log("Socket error:", err.message);
    });
});


// ============================
// HEARTBEAT — kill dead sockets
// ============================
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            console.log("Killing dead socket");
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);


// ============================
// START SERVER
// ============================
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});