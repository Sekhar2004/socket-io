const socket = io('http://localhost:3000');

const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const roomInput = document.getElementById('roomInput');
const userNameInput = document.getElementById('userNameInput');
const roomUserCount = document.getElementById('roomUserCount');

const joinRoomBtn = document.getElementById('joinRoomBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');

let currentRoom = '';
let username = '';

socket.on('userJoined', (message) => {
    displayMessage(message, 'receiver');
});

socket.on('message', (messageData) => {
    const { message, sender } = messageData;
    if (sender === username) {
        displayMessage(message, 'sender');
    } else {
        displayMessage(message, 'receiver');
    }
});

socket.on('roomUsers', (userCount) => {
    roomUserCount.textContent = `Online: ${userCount}`;
});

joinRoomBtn.addEventListener('click', () => {
    const room = roomInput.value;
    username = userNameInput.value;

    if (room && username) {
        socket.emit('joinRoom', { room, username });
        currentRoom = room;
        displayMessage(`You are in room`, 'sender');
    } else {
        alert('Please enter both a room ID and username');
    }
});

sendMessageBtn.addEventListener('click', () => {
    const message = messageInput.value;
    if (message && currentRoom) {
        socket.emit('message', { room: currentRoom, message });
        messageInput.value = '';
    }
});

function displayMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);

    const profileName = document.createElement('div');
    profileName.classList.add('profile-name');
    profileName.textContent = type === 'sender' ? 'You' : 'User'; 
    messageDiv.appendChild(profileName);

    const text = document.createElement('div');
    text.classList.add('text');
    text.textContent = message;
    messageDiv.appendChild(text);

    chatDiv.appendChild(messageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight; 
}
