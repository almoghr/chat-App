const path = require('path')
const http = require ('http')
const express = require ('express')
const socketio = require ('socket.io')
const Filter = require ('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => { // השרת מדבר אל הקליינט
    console.log('New WebSocket connection established.')

    const welcomeMessage = 'welcome dear user to my chat app'
    socket.emit('message', generateMessage(welcomeMessage)) // רק המשתמש הספציפי שמחובר מהקליינט עצמו יראה את ההודעה
    socket.broadcast.emit('message', generateMessage('A new user has joined')) //שולח לכולם הודעה פרט למשתמש שהתחבר כעת.

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
        io.emit('locationMessage', generateLocationMessage(url)) 
        cb('location shared')
    })
    
    socket.on('disconnect', () => {
        io.emit('message', generateMessage('a user has left'))
    })
})



server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})
