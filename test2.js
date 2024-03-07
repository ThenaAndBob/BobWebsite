// app.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Database configuration
const db = new sqlite3.Database('messages.db');

// Create 'messages' table if it doesn't exist
db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Retrieve previous messages from the database and send to the new user
  db.all('SELECT message FROM messages', (err, rows) => {
    if (err) {
      console.error('Error retrieving messages from the database:', err);
      return;
    }
    rows.forEach((row) => {
      socket.emit('chat message', row.message);
    });
  });

  // Listen for chat messages
  socket.on('chat message', (msg) => {
    // Broadcast the message to all connected clients
    io.emit('chat message', msg);

    // Save the message to the database
    db.run('INSERT INTO messages (message) VALUES (?)', [msg], (err) => {
      if (err) {
        console.error('Error saving message to the database:', err);
      }
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});