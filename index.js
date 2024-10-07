const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
let chatHistory = [];
let users = {};
let lastMessageTime = {};

const swearWords = [
  "anal", "anus", "arse", "ass", "asshole", "ballsack", "bastard", "biatch", "bitch", "blowjob", 
  "bollock", "boner", "boob", "boobs", "buttplug", "clitoris", "cock", "cum", "cunt", "dick", 
  "dildo", "erection", "feck", "fellate", "fellatio", "felching", "fuck", 
  "genitals", "jerk", "jizz", "masturbate", "muff", 
  "penis", "piss", "poop", "pube", "pussy", "scrotum", "sex", "shit", "sh1t", 
  "slut", "tit", "tits", "titty", "turd", "twat", 
  "vagina", "wank", "whore", "asshat", "fvck", "pu55y", "pen1s"
];

function isUsernameValid(username) {
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  return username.length <= 16 && usernameRegex.test(username) && !containsSwearWord(username);
}

function containsSwearWord(message) {
  return swearWords.some(word => message.toLowerCase().includes(word));
}

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.emit('previous messages', chatHistory);

  socket.on('user joined', (username) => {
    if (!isUsernameValid(username)) {
      socket.emit('username rejected');
      return;
    }

    users[socket.id] = username;
    lastMessageTime[socket.id] = 0;
    const joinMessage = { username: "System", message: `${username} has joined the chat`, type: "system" };
    io.emit('chat message', joinMessage);
  });

  socket.on('chat message', (data) => {
    const currentTime = Date.now();
    const cooldownTime = 3000;

    if (currentTime - lastMessageTime[socket.id] < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - (currentTime - lastMessageTime[socket.id])) / 1000);
      socket.emit('message rejected', { message: `Please wait ${remainingTime} seconds before sending another message!` });
      return;
    }

    if (containsSwearWord(data.message)) {
      socket.emit('message rejected');
      return;
    }

    chatHistory.push(data);
    io.emit('chat message', data);
    lastMessageTime[socket.id] = currentTime;
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      const leaveMessage = { username: "System", message: `${username} has left the chat`, type: "system" };
      io.emit('chat message', leaveMessage);
      delete users[socket.id];
      delete lastMessageTime[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
