let Peer = require("simple-peer")
let socket = io()
const video = document.querySelector('video'); 
let client = {} 

// window. .addEventListener('click', sendMessage())
window.addEventListener("keydown", handle, true);
const receive = document.getElementById('received')
function handle(e){
    if(e.key == "Enter"){
        let content = document.getElementById('inputdata').value
       let msg = document.createElement('li')
       msg.className ="list-group-item list-group-item-primary bd-highlight h4"
       msg.append(`${content}`)
        receive.appendChild(msg)
        msg.scrollIntoView(false)
        clear()
    }
}

function clear(){
    document.getElementById('inputdata').value = ""
}



// function sendMessage(messageSend){
//     alert(messageSend)
// }


navigator.mediaDevices.getUserMedia({video: true, audio: true})
.then(stream => {
    socket.emit("NewClient")
    video.srcObject = stream
    video.play()
    function InitPeer(type){
        let peer = new Peer({initiator:(type == 'init') ? true : false, stream: stream, trickle: false})
        peer.on('stream', function(stream){
            CreateVideo(stream)
        })
        peer.on('close', function(){
            document.getElementById("peerVideo").remove();
            peer.destroy()
        })
        return peer 
    }
    function MakePeer(){
        client.gotAnswer = false
        let peer = InitPeer('init')
        peer.on('signal', function(data){
            if(!client.gotAnswer){
                socket.emit('Offer', data)
            }
        })
        client.peer = peer
    }
    function FrontAnswer(offer){
        let peer = InitPeer('notInit')
        peer.on('signal', (data) => {
            socket.emit('Answer', data)
        })
        peer.signal(offer)
    }
    function SignalAnswer(answer){ 
        client.gotAnswer = true
        let peer = client.peer
        peer.signal(answer)
    }
    function CreateVideo(stream){
        let video = document.createElement('video')
        video.id = 'peerVideo'
        video.srcObject = stream 
        video.class = "embed-responsive-item"
        document.querySelector("#peerDiv").appendChild(video)
        video.play()
    }
    function SessionActive(){
        document.write('Session Active. Please Come Back Later')
        //add event listener here
    }

    socket.on('BackOffer', FrontAnswer)
    socket.on('BackAnswer', SignalAnswer)
    socket.on('SessionActive', SessionActive)
    socket.on('CreatePeer', MakePeer)
     
})
.catch(err => document.write(err))