const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', ({ room, username }) => {
        socket.join(room);
        socket.username = username;
        console.log(`(${username}) joined room ${room}`);
        const roomUsers = io.sockets.adapter.rooms.get(room)?.size || 0;

        socket.to(room).emit('userJoined', `${username} joined the room`);
        socket.emit('roomUsers', roomUsers);
    });

    socket.on('message', ({ room, message }) => {
        socket.emit('message', { message, sender: socket.username });
        socket.to(room).emit('message', { message, sender: socket.username });
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.username || socket.id} disconnected`);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
