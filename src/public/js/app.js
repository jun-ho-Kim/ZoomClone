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
let myDataChannel

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
        audio: false,
        video: { facingMode: 'user' },
    };

    const cameraConstrains = {
        audio: false,
        video: { deviceId: { exact: deviceId } },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialContrains
        )
        console.log('myStream', myStream)
        myFace.srcObject = myStream
        if (!deviceId) {
            await getCameras()
        }
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
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0]
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === 'video')
        videoSender.replaceTrack(videoTrack)
    }
}

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)
camerasSelecet.addEventListener('input', handleCameraChange)


// Welcom Form (Join a Room)

const welcome = document.getElementById('welcome')
const welcomeForm = welcome.querySelector('form')

async function initCall() {
    welcome.hidden = true
    call.hidden = false
    await getMedia()
    makeConnection()
}

async function handleWelcomSumbit(event) {
    event.preventDefault()
    const input = welcomeForm.querySelector('input')
    await initCall()
    socket.emit('join_room', input.value)
    roomName = input.value
    input.value = ''
}

welcomeForm.addEventListener('submit', handleWelcomSumbit)

//peerA(????????? room??? ?????? ?????????)??? ?????????????????? ??????
socket.on('welcome', async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event) => console.log(event.data));
    console.log("made data channel");

    const offer = await myPeerConnection.createOffer()
    myPeerConnection.setLocalDescription(offer)
    console.log("sent the offer");
    socket.emit('offer', offer, roomName)
})

//peerB(?????? ????????? ?????????)??? ?????????????????? ??????
socket.on('offer', async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) =>
            console.log(event)
        );
    })
    console.log('recevied the offer')
    myPeerConnection.setRemoteDescription(offer)
    const answer = await myPeerConnection.createAnswer()
    myPeerConnection.setLocalDescription(answer)
    socket.emit('answer', answer, roomName)
    console.log('sent the answer')
})

socket.on('answer', (answer) => {
    console.log('received the answer')
    myPeerConnection.setRemoteDescription(answer)
})

socket.on('ice', ice => {
    console.log('received candidate')
    myPeerConnection.addIceCandidate(ice)
})

// RTC Code

//?????? ??????????????? peer-to-peer ??????
//??? ?????? ?????? ?????????????????? ???????????? ???????????? ????????? stream??? ????????? 
// ???????????? ?????? ?????? ?????????.
function makeConnection() {
    myPeerConnection = new RTCPeerConnection()
    myPeerConnection.addEventListener('icecandidate', handleIce)
    myPeerConnection.addEventListener("addstream", (data) => {
        console.log('data.stream', data.stream)
        const peerFace = document.getElementById("peerFace");
        peerFace.srcObject = data.stream;
    });
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream))
}

function handleIce(data) {
    console.log('Sent candidate', data)
    socket.emit('ice', data.candidate, roomName)
}

function handleAddStream(data) {
    console.log('data.stream', data.stream)
    const peerFace = document.getElementById('peerFace')
}
