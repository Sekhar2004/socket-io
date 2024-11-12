const socket = io('http://localhost:3000');

const authSection = document.getElementById('authSection');
const registerLink = document.getElementById('registerLink');
const loginLink = document.getElementById('loginLink');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTitle = document.getElementById('authTitle');
const chatSection = document.getElementById('chatSection');
const chatDiv = document.getElementById('chat');
const roomInput = document.getElementById('roomInput');
const roomUserCount = document.getElementById('roomUserCount');
const messageInput = document.getElementById('messageInput');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');

const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const sendMessageBtn = document.getElementById('sendMessageBtn');

let currentRoom = '';
let username = '';
let token = '';  // JWT Token

registerLink.addEventListener('click', function() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authTitle.textContent = 'Register';
});

loginLink.addEventListener('click', function() {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    authTitle.textContent = 'Login';
});

registerBtn.addEventListener('click', async () => {
    const user = registerUsername.value;
    const password = registerPassword.value;

    if (user && password) {
        const response = await fetch('http://127.0.0.1:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password })
        });

        const result = await response.json();
        alert(result.message || 'Registration failed');
        
        if (result.message && result.message === 'User registered successfully.') {  
            registerForm.style.display = 'none'; 
            loginForm.style.display = 'block'; 
            authTitle.textContent = 'Login';    
        }
    }
});


loginBtn.addEventListener('click', async () => {
    const user = loginUsername.value;
    const password = loginPassword.value;

    if (user && password) {
        const response = await fetch('http://127.0.0.1:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password })
        });

        const result = await response.json();
        if (result.token) {
            token = result.token;
            username = user;

            authSection.style.display = 'none';
            chatSection.style.display = 'flex';
        } else {
            alert(result.message || 'Login failed');
        }
    }
});

joinRoomBtn.addEventListener('click', () => {
    const room = roomInput.value;
    if (room && username && token) {
        socket.emit('joinRoom', room, username);
        currentRoom = room;

        fetchMessages(room); 
    }
});

// Send message
sendMessageBtn.addEventListener('click', async () => {
    const message = messageInput.value;
    if (message && token) {
        const response = await fetch('http://127.0.0.1:3000/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ room: currentRoom, message })
        });

        const result = await response.json();
        if (result.success) {
            socket.emit('message', { username, message });

            messageInput.value = '';
        }
    }
});

socket.on('message', data => {
    const messageElement = document.createElement('p');
    messageElement.classList.add('message');

    if (data.username === username) {
        messageElement.classList.add('sender');
    } else {
        messageElement.classList.add('receiver');
    }

    messageElement.innerHTML = `<strong>${data.username}</strong>: ${data.message}`;
    chatDiv.appendChild(messageElement);
    
    chatDiv.scrollTop = chatDiv.scrollHeight;
});

function fetchMessages(room) {
    fetch(`http://127.0.0.1:3000/messages/${room}`)
        .then(response => response.json())
        .then(messages => {
            chatDiv.innerHTML = ''; 
            messages.forEach(msg => {
                const messageElement = document.createElement('p');
                messageElement.classList.add('message');
                
                if (msg.username === username) {
                    messageElement.classList.add('sender');
                } else {
                    messageElement.classList.add('receiver');
                }

                messageElement.innerHTML = `<strong>${msg.username}</strong>: ${msg.message}`;
                chatDiv.appendChild(messageElement);
            });
        });
}

socket.on('previousMessages', messages => {
    messages.forEach(msg => {
        const messageElement = document.createElement('p');
        messageElement.classList.add('message');
        
        // Assign sender or receiver class
        if (msg.username === username) {
            messageElement.classList.add('sender');
        } else {
            messageElement.classList.add('receiver');
        }

        messageElement.innerHTML = `<strong>${msg.username}</strong>: ${msg.message}`;
        chatDiv.appendChild(messageElement);
    });
});

socket.on('roomUsers', userCount => {
    roomUserCount.textContent = `Users in room: ${userCount}`;
});
