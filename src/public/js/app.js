const socket = io()

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const camerasSelecet = document.getElementById('cameras')

let myStream
let muted = false
let cameraOff = false

async function getCameras() {
    try {
        const devices = await this.navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(device => device.kind === "videoinput")
        cameras.forEach((camera) => {
            const option = document.createElement('option')
            option.value = camera.deviceId
            option.innerText = camera.label
            camerasSelecet.appendChild(option)
        })
    } catch (error) {
        console.log('error', error)
    }
}

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
        })
        getCameras()
        myFace.srcObject = myStream
    } catch (error) {
        console.log('error', error)
    }
}

getMedia()

function handleMuteClick() {
    if (!muted) {
        muteBtn.innerText = 'Unmute'
        muted = true
    } else {
        muteBtn.innerText = 'Mute'
        muted = false
    }
}

function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => track.enabled = !track.enabled)
    if (cameraOff) {
        cameraBtn.innerText = 'Turn Camera off'
        cameraOff = false
    } else {
        cameraBtn.innerText = 'Turn Camera On'
        cameraOff = true
    }
}

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)