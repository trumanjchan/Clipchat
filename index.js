const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var clients = [];
var typingusers = [];

app.use('/favicon.ico', express.static('public/favicon.ico'));
app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    var count = clients.length;
    io.emit('update-num-users', count);
    io.emit('update-user-list', clients);

    socket.on('storeClientInfo', function (data) {
        var nickavailability = clients.find(obj => {
            return obj.username === data.username.trim();
        })
        if (nickavailability == undefined && data.username.length < 11 && data.username.trim().length != 0) {
            io.emit('new-nickname');
            var nickname = data.username;
            var clientInfo = new Object();
            clientInfo.clientId = socket.id;
            clientInfo.username = nickname;
            clients.push(clientInfo);
            console.log(clients);
            io.emit('announce-user', nickname);
            console.log('Welcome, ' + nickname + '!');

            count = clients.length;
            io.emit('update-num-users', count);
            io.emit('update-user-list', clients);

            socket.on('user-typing', (data) => {
                if (!typingusers.includes(data)) {
                    typingusers.push(data);
                }
                io.emit('user-typing', typingusers.join(", ") + ' is typing...');
            });
            socket.on('user-stopped-typing', (data) => {
                let index = typingusers.indexOf(data);
                if (index !== -1) {
                    typingusers.splice(index, 1);
                }

                if (typingusers.length > 0) {
                    io.emit('user-typing', typingusers.join(", ") + ' is typing...');
                }
                else {
                    io.emit('user-typing', '');
                }
            });
            socket.on('chat-message', msg => {
                io.emit('chat-message', {nickname, msg});
                console.log(nickname + ': ' + msg);
            });
            socket.on('privatemessaging', data => {
                let clientgroupchat = data.groupchat;
                let clientpm = data.pm;
                for (var i = 0; i < clientgroupchat.length; i++) {
                    var result = clients.find(obj => {
                        return obj.username === clientgroupchat[i];
                    })

                    clientgroupchat[i] = 'me';
                    io.to(result.clientId).emit('private-message', {nickname, clientgroupchat, clientpm});
                    clientgroupchat[i] = result.username;
                }
            });

            socket.on('disconnect', () => {
                if (typingusers.includes(nickname)) {
                    let index = typingusers.indexOf(nickname);
                    if (index !== -1) {
                        typingusers.splice(index, 1);
                    }

                    if (typingusers.length > 0) {
                        io.emit('user-typing', typingusers.join(", ") + ' is typing...');
                    }
                    else {
                        io.emit('user-typing', '');
                    }
                }

                clients = clients.filter(person => person.username != nickname);
                console.log(clients);
                io.emit('user-left', nickname);
                count = clients.length;
                io.emit('update-num-users', count);
                io.emit('update-user-list', clients);
                console.log('Disconnected: ' + nickname);
            });
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});