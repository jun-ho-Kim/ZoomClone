const socket = new WebSocket(`ws://${window.location.host}`)

socket.addEventListener('open', () => {
    console.log('Connected to Server ✅')
})

socket.addEventListener('message', (message) => {
    console.log('New Message', message)
})

socket.addEventListener('close', () => {
    console.log('Disconnected from Server X')
})

setTimeout(() => {
    socket.send('hello from the brower!')
}, 10000)