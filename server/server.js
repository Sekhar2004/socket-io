require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: 'http://127.0.0.1:5500',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type','Authorization'],
    },
});

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json());
const mongoURI = process.env.MONGODB_URI;


mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Could not connect to MongoDB:', err));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function verifyToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(403).send('Access denied.');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(400).send('Invalid token.');
        req.user = decoded;
        next();
    });
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.send({ message: 'User registered successfully.' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('Invalid username or password.');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid username or password.');

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });

    res.send({ token });
});

app.post('/message', verifyToken, async (req, res) => {
    const { room, message } = req.body;
    const { username } = req.user;

    const newMessage = new Message({ room, username, message });
    await newMessage.save();

    io.to(room).emit('message', { username, message });

    res.send({ message: 'Message sent successfully.' });
});

app.get('/messages/:room', async (req, res) => {
    const { room } = req.params;
    const messages = await Message.find({ room }).sort({ createdAt: 1 });

    res.send(messages);
});

let users = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (room, username) => {
        users.push({ id: socket.id, room, username });
        socket.join(room);
        console.log(`${username} joined room: ${room}`);

        Message.find({ room }).sort({ createdAt: 1 })
            .then(messages => {
                socket.emit('previousMessages', messages);
            });

        io.to(room).emit('roomUsers', users.filter(user => user.room === room).length);
    });

    socket.on('message', async (data) => {
        try {
            await Message.create({ room: data.room, username: data.username, message: data.message });
            io.to(data.room).emit('message', data);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        const userIndex = users.findIndex(user => user.id === socket.id);
        if (userIndex !== -1) {
            const user = users.splice(userIndex, 1)[0];
            io.to(user.room).emit('roomUsers', users.filter(u => u.room === user.room));
            console.log(`${user.username} disconnected`);
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on port 3000');
});
