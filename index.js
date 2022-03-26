const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Connected: ' + socket.id);
    const user = socket.id;
    io.emit('announce-user', user);

    const count = io.of("/").sockets.size;
    io.emit('update-num-users', count);

    socket.on('chat-message', msg => {
        io.emit('chat-message', user + ': ' + msg);
        console.log(user + ': ' + msg);
    });
    socket.on('disconnect', () => {
        io.emit('user-left', user);
        io.emit('update-num-users', count);
        console.log('Disconnected: ' + user);
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});