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

        var count = clients.length;
        io.emit('update-num-users', count);
        io.emit('update-user-list', clients);

        socket.on('chat-message', msg => {
            io.emit('chat-message', data.username + ': ' + msg);
            console.log(data.username + ': ' + msg);
        });
        socket.on('disconnect', () => {
            clients = clients.filter(person => person.username != data.username);
            console.log(clients);
            io.emit('user-left', data.username);
            count = clients.length;
            io.emit('update-num-users', count);
            io.emit('update-user-list', clients);
            console.log('Disconnected: ' + data.username);
        });
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});