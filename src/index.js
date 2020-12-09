const path = require('path')
const http = require ('http')
const express = require ('express')
const socketio = require ('socket.io')
const Filter = require ('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => { // השרת מדבר אל הקליינט
    console.log('New WebSocket connection established.')

    
    socket.on('join', ({ username, room }, cb) => {
        const { error, user } = addUser({id: socket.id, username, room})
        if(error) {
            return cb(error)
        }

        socket.join(user.room)
        
        const welcomeMessage = `welcome ${user.username} to the chat app u are now in room: ${user.room}`
        socket.emit('message', generateMessage(welcomeMessage)) // רק המשתמש הספציפי שמחובר מהקליינט עצמו יראה את ההודעה
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`)) //שולח לכולם הודעה פרט למשתמש שהתחבר כעת.

        cb()
    })

    socket.on('sendMessage', (message, cb) => {
        const filter = new Filter()
        if(filter.isProfane(message)){
            return cb('Foul language is not allowed.')
        }
        io.emit('message', generateMessage(message)) // כל המשתמשים יראו את ההודעה
        cb()
    })

    socket.on('sendLocation', (coords, cb) => {
        const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        io.to('wow').emit('locationMessage', generateLocationMessage(url)) 
        cb('location shared')
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(` ${user.username} has left`))
        }
    })
})



server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})
