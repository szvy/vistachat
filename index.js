const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
let chatHistory = [];
let users = {};

const swearWords = [
  "anal", "anus", "arse", "ass", "asshole", "ballsack", "bastard", "biatch", "bitch", "blowjob", 
  "bollock", "boner", "boob", "boobs", "buttplug", "clitoris", "cock", "cum", "cunt", "dick", 
  "dildo", "erection", "feck", "fellate", "fellatio", "felching", "fuck", 
  "genitals", "jerk", "jizz", "masturbate", "muff", 
  "penis", "piss", "poop", "pube", "pussy", "scrotum", "sex", "shit", "sh1t", 
  "slut", "tit", "tits", "titty", "turd", "twat", 
  "vagina", "wank", "whore", "asshat", "fvck", "pu55y", "pen1s"
];

function containsSwearWord(str) {
  const lowerStr = str.toLowerCase();
  return swearWords.some(word => lowerStr.includes(word));
}

function isUsernameValid(username) {
  return !containsSwearWord(username);
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
    const joinMessage = { username: "System", message: `${username} has joined the chat`, type: "system" };
    io.emit('chat message', joinMessage);
  });
  socket.on('chat message', (data) => {
    if (containsSwearWord(data.message)) {
      socket.emit('message rejected');
      return;
    }

    chatHistory.push(data);
    io.emit('chat message', data);
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      const leaveMessage = { username: "System", message: `${username} has left the chat`, type: "system" };
      io.emit('chat message', leaveMessage);
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
