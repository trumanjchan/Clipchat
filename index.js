const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var clients = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('storeClientInfo', function (data) {
        var clientInfo = new Object();
        clientInfo.clientId = socket.id;
        clientInfo.username = data.username;
        clients.push(clientInfo);
        console.log(clients);
        io.emit('announce-user', data.username);
        console.log('Welcome, ' + data.username + '!');

        socket.on('chat-message', msg => {
            io.emit('chat-message', data.username + ': ' + msg);
            console.log(data.username + ': ' + msg);
        });
        socket.on('disconnect', () => {
            clients = clients.filter(person => person.username != data.username);
            console.log(clients);
            io.emit('user-left', data.username);
            io.emit('update-num-users', count);
            console.log('Disconnected: ' + data.username);
        });
    });

    const count = io.of("/").sockets.size;
    io.emit('update-num-users', count);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});