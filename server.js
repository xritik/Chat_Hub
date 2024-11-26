const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 8080;
const mongoURL = process.env.DB_URL;


// CORS Configuration
const corsOptions = {
    origin: 'http://localhost:8081',  // Allow only requests from this origin
    credentials: true,               // Allow credentials (cookies) to be sent
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Middleware to parse JSON request bodies
    app.use(express.json());


// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/mydb')
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Define a User Schema and Model
const userSchema = new mongoose.Schema({
    fullname: String,
    gender: String,
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists in the database
    const user = await User.findOne({username, password });

    if (user) {
        res.status(200).json({ message: 'Login successful'});
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

app.post('/signup', async (req, res) => {
    const {fullname, gender, username, password} = req.body;

    // Check if the user exists in the database
    const user = await User.findOne({username});

    if(user){
        return res.status(401).json({message: 'User already exists, please try again'});
    }
    try {
        // Create a new user and save it to the database
        const newUser = new User({fullname, gender, username, password });
        await newUser.save();
        res.status(201).json({ message: `${fullname} added successfully` });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: 'An error occurred while creating the user' });
    }
});


// Dashboard Route to Fetch Logged-In User's Data
app.get('/dashboard', async (req, res) => {
    const loginUser = req.headers['login-user']; // Extract username from request headers
    if (!loginUser) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username: loginUser });

        if (user) {
            const allUsers = await User.find({}, { username: 1, fullname: 1, gender: 1, _id: 0 }); // Fetch all users (only username)
            res.status(200).json({ 
                fullname: user.fullname, 
                gender: user.gender,
                users: allUsers, // Send all registered users
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: 'An error occurred while fetching user data' });
    }
});

app.get('/chat', async (req, res) => {
    try {
        const allUsers = await User.find({}, { username: 1, fullname: 1, gender: 1, _id: 0 });
        res.status(200).json({users: allUsers})
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: 'An error occurred while fetching user data' });
    }
});



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

app.post('/chat/start', async (req, res) => {
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



app.post('/chat/send', async (req, res) => {
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

app.get('/api/chat/:chatId', async (req, res) => {
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





app.listen(PORT, () => console.log('Server is running at port', PORT));