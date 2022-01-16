const socket = io()

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const camerasSelecet = document.getElementById('cameras')
const call = document.getElementById('call')

call.hidden = true

let myStream
let muted = false
let cameraOff = false
let roomName
let myPeerConnection

async function getCameras() {
    try {
        const devices = await this.navigator.mediaDevices.enumerateDevices()
        const cameras = devices.filter(device => device.kind === "videoinput")
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement('option')
            option.value = camera.deviceId

            if (currentCamera.label === camera.label) {
                option.selected = true
            }

            option.innerText = camera.label
            camerasSelecet.appendChild(option)
        })
    } catch (error) {
        console.log('error', error)
    }
}

async function getMedia(deviceId) {
    const initialContrains = {
        audio: true,
        video: { facingMode: 'user' },
    };

    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialContrains
        )

        if (!deviceId) {
            await getCameras()
        }
        myFace.srcObject = myStream
    } catch (error) {
        console.log('error', error)
    }
}

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
async function handleCameraChange() {
    await getMedia(camerasSelect.value);
}

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)
camerasSelecet.addEventListener('input', handleCameraChange)


// Welcom Form (Join a Room)

const welcome = document.getElementById('welcome')
const welcomeForm = welcome.querySelector('form')

async function startMedia() {
    welcome.hidden = true
    call.hidden = false
    await getMedia()
    makeConnection()
}

function handleWelcomSumbit(event) {
    event.preventDefault()
    const input = welcomeForm.querySelector('input')
    socket.emit('join_room', input.value, startMedia)
    roomName = input.value
    input.value = ''
}

welcomeForm.addEventListener('submit', handleWelcomSumbit)

//peerA인 브라우저에서 실행
socket.on('welcome', async () => {
    const offer = await myPeerConnection.createOffer()
    myPeerConnection.setLocalDescription(offer)
    console.log("sent the offer");
    socket.emit('offer', offer, roomName)
})

socket.on('offer', (offer) => {
    console.log(offer)
})

// RTC Code

//양쪽 브라우저에 peer-to-peer 연결
//그 다음 양쪽 브라우저에서 카메라와 마이크의 데이터 stream을 받아서 
// 그것들을 안에 집어 넣었다.
function makeConnection() {
    myPeerConnection = new RTCPeerConnection()
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream))
}
