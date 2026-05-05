require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 8080;
require('./db');

const Chat = require('./models/chats');

const corsOptions = {
    origin: '*',
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/login', require('./routes/loginRoutes'));
app.use('/signup', require('./routes/signupRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/chat', require('./routes/chatRoutes'));
app.use('/users', require('./routes/userRoutes'));

// 🔥 CREATE HTTP SERVER
const server = http.createServer(app);

// 🔥 WEBSOCKET SERVER
const wss = new WebSocket.Server({ server });

// 🔥 Store connected clients
let clients = {}; // userId -> ws

wss.on("connection", (ws) => {
    console.log("✅ New WebSocket connection");

    // 💓 Heartbeat (detect dead connections)
    ws.isAlive = true;

    ws.on("pong", () => {
        ws.isAlive = true;
    });

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            // ✅ 1. Register user
            if (data.type === "register") {
                const { userId } = data;

                // ❗ If user already connected → close old socket
                if (clients[userId] && clients[userId] !== ws) {
                    try {
                        clients[userId].close();
                    } catch (e) {}
                }

                clients[userId] = ws;
                ws.userId = userId;

                console.log(`🟢 User registered: ${userId}`);
                console.log("👥 Active users:", Object.keys(clients));
                return;
            }

            const { chatId, sender, receiverId, message: text } = data;

            if (!chatId || !sender || !receiverId || !text) {
                console.log("⚠️ Invalid message data:", data);
                return;
            }

            // ✅ 2. Save message
            const chat = await Chat.findById(chatId);
            if (!chat) {
                console.log("❌ Chat not found:", chatId);
                return;
            }

            const newMessage = {
                sender,
                message: text,
                timestamp: new Date().toISOString(),
            };

            chat.messages.push(newMessage);
            await chat.save();

            const payload = JSON.stringify({
                chatId,
                sender,
                message: text,
                timestamp: newMessage.timestamp
            });

            // ✅ helper function (safe send)
            const safeSend = (client, label) => {
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                } else {
                    console.log(`⚠️ ${label} socket not available`);
                }
            };

            // ✅ 3. Send to receiver
            safeSend(clients[receiverId], "Receiver");

            // ✅ 4. Send to sender
            safeSend(clients[sender], "Sender");

        } catch (err) {
            console.error("❌ WS Error:", err);
        }
    });

    // ✅ 5. Cleanup on disconnect
    ws.on("close", () => {
        if (ws.userId && clients[ws.userId] === ws) {
            delete clients[ws.userId];
            console.log(`❌ User disconnected: ${ws.userId}`);
            console.log("👥 Active users:", Object.keys(clients));
        }
    });

    ws.on("error", (err) => {
        console.log("⚠️ Socket error:", err.message);
    });
});


// 💓 Ping clients every 30 sec (detect dead sockets)
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            console.log("💀 Terminating dead socket");
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);


// 🚀 START SERVER
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});