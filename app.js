const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/uikit'));
app.use(express.static(__dirname + '/views'));

let socketRoom = [];

io.sockets.on('connection', function(socket) {
    //접속완료 알림
    socket.emit('connected');

    // 접속한 클라이언트의 정보가 수신되면
    socket.on('login', function(data) {
        console.log("-----");
        console.log('Client logged-in:\n name:' + data.name);

        // socket에 클라이언트 정보를 저장한다
        socket.name = data.name;

        // 접속된 모든 클라이언트에게 메시지를 전송한다
        io.emit('login', data.name);
    });

    socket.on('requestRandomChat', function(data){
        // 빈방이 있는지 확인
        console.log('requestRandomChat');
        let rooms = io.sockets.adapter.rooms;
        console.log(io.sockets.adapter.rooms);
        for (let key in rooms){
            if (key == ''){
                continue;
            }
            // 혼자있으면 입장
            console.log(rooms[key].length);
            if (rooms[key].length == 1) {
                console.log(1);
                let roomKey = key.replace('/', '');
                socket.join(roomKey);
                io.sockets.in(roomKey).emit('completeMatch', {});
                socketRoom[socket.id] = roomKey;
                console.log(socket.id);
                return;
            }
        }
        // 빈방이 없으면 혼자 방만들고 기다림.
        console.log(socket.id);
        socket.join(socket.id);
        socketRoom[socket.id] = socket.id;
    });

    // client -> server Message전송 시
    socket.on('sendMessage', function(data) {
        let msg = {
            name: socket.name,
            message: data.message
        }
        console.log(socket.name)
        console.log('sendMessage!');
        io.sockets.in(socketRoom[socket.id]).emit('receiveMessage', msg);
    });

    // disconnect
    socket.on('disconnect', function(data){
        let key = socketRoom[socket.id];
        socket.leave(key);
        io.sockets.in(key).emit('disconnect');
        let clients = io.sockets.clients(key);
        for (let i = 0; i < clients.length; i++){
            clients[i].leave(key);
        }
    });
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

http.listen(3065, () => {
    console.log('서버 구동 3065PORT');
});