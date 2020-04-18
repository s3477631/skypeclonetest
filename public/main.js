let Peer = require("simple-peer")
let socket = io()
const video = document.querySelector('video'); 
let client = {} 




window.addEventListener("keydown", handle, true);

let typingIn = document.getElementById('inputdata')

typingIn.addEventListener('keydown', sendTyping, true);
const receive = document.getElementById('received')
function handle(e){
    if(e.key == "Enter"){
        let today = new Date();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let name = document.getElementById('inputname').value
        document.getElementById('name-picker').style = "display: none;"
        let content = document.getElementById('inputdata').value
        let msg = document.createElement('li')
        let msgContent = {
            content: content,
            time: time, 
            name: name
        }
       
       msg.className ="list-group-item list-group-item-primary bd-highlight h4"
       msg.append(`${msgContent.name}- ${msgContent.content}- ${msgContent.time}`)
       socket.emit('textmessage', msgContent)
        receive.appendChild(msg)
        msg.scrollIntoView(false)
        clear()
        document.getElementById('inputdata').focus()
      

    }
}

function sendTyping(e){
    let Mename = document.getElementById('inputname').value
    console.log(Mename)
    socket.emit('typingaway', Mename)
}

function HandleTyping(msg){
    let name = document.getElementById('inputname').value
    if(msg != name){
        console.log(`${msg} is typing`)
        document.getElementById('progress-spinner').style = "visibility: visible;"
       document.getElementById('name-here').value = `${msg} is typing...`
    }
    setTimeout(function(){
        document.getElementById('progress-spinner').style = "visibility: hidden;"
        document.getElementById('name-here').value = ''
    }, 1500);
}


function clear(){
    document.getElementById('inputdata').value = ""
}





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

    function HandleMsg(msg){
        console.log(msg)
        otherGuy = msg.name
        let today = new Date();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let msgElem = document.createElement('li')
        
        msgElem.className ="list-group-item list-group-item-success text-right bd-highlight h4"
        msgElem.append(`${msg.name}-${msg.content}-${time}`)
         receive.appendChild(msgElem)
         msgElem.scrollIntoView(false)
    }

    

    socket.on('istyping', HandleTyping)
    socket.on('backmsg', HandleMsg)
    socket.on('BackOffer', FrontAnswer)
    socket.on('BackAnswer', SignalAnswer)
    socket.on('SessionActive', SessionActive)
    socket.on('CreatePeer', MakePeer)
     
})
.catch(err => document.write(err))