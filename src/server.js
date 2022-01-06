import express from 'express'
import http from 'http'
import { SocketAddress } from 'net';
import { Server } from 'socket.io'

const app = express();

app.set('view engine', 'pug')
app.set('views', __dirname + '/views')
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (req, res) => res.render('home'))

const httpServer = http.createServer(app)
const wsServer = new Server(httpServer)

function publicRooms() {
    const {
        sockets: {
            adapter: { sids, rooms }
        }
    } = wsServer

    const publicRooms = []

    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key)
        }
    })

    return publicRooms
}

wsServer.on('connection', (socket) => {
    socket["nickname"] = "Anon"
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`)
    })
    socket.on('enter_room', (roomName, done) => {
        socket.join(roomName)
        done()
        socket.to(roomName).emit('welcome', socket.nickname)
        wsServer.sockets.emit('room_change', publicRooms())
    })
    socket.on('disconnecting', () => {
        //이것은 array 같은 set이여서 iterable(반복)이 가능하다
        socket.rooms.forEach(room => socket.to(room).emit('bye', socket.nickname))
        wsServer.sockets.emit('room_change', publicRooms())
    })
    socket.on('new_message', (msg, room, done) => {
        socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`)
        done()
    })
    socket.on('nickname', (nickname) => (socket["nickname"] = nickname))
})
/*
const wss = new WebSocket.Server({ server });

//서로 다른 브라우저에서도 메세지를 주고 받을 수 있도록
// sockets array에 socket들을 넣어준 후 sockets에게 message를 보낸다.
const sockets = []

wss.on('connection', (socket) => {
    socket['nickname'] = '익명'
    console.log('Connected to Brower ✅')
    sockets.push(socket)
    socket.on('close', () => console.log('Disconnected from the Brower ❎'))
    socket.on('message', (msg) => {
        const message = JSON.parse(msg)
        switch (message.type) {
            case 'new_message':
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`))
                break;
            case 'nickname':
                socket['nickname'] = message.payload
                break;
        }
    })

})
*/
const handleListen = () => console.log(`Listening on http://localhost:3000`);

httpServer.listen(3000, handleListen);