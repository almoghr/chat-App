const socket = io() // הקליינט מדבר אל השרת

// Elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = document.querySelector('#message-form-input')
const messageFormButton = document.querySelector('#message-form-button')
const locationButton = document.querySelector('#location-button')
const messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const messageLocationTemplate = document.querySelector('#message-location-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })
console.log(location.search)

socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    })
    messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (location) => {
    console.log(location)

    const html = Mustache.render(messageLocationTemplate, {
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
})



messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
    messageFormButton.removeAttribute('disabled')
    messageFormInput.value = ''
    messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('message sent')
        
    })
})

locationButton.addEventListener('click', (e) => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    } 
    locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (msg) => {
            locationButton.removeAttribute('disabled')
            console.log(msg)
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if (error){
        alert(error)
        location.href='/'
    }
})
