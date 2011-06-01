// IM chat
// Binds a ROUTER socket on 5555

require('tty').setRawMode(true);

var context = require('zeromq')
  , router  = context.createSocket('router')
  , request     = context.createSocket('request')
  , reply     = context.createSocket('reply')
  , name    = process.env.NAME || process.env.USER
  , connect_port  = process.env.CONNECT_PORT || '5555'
  , serve_port = process.env.SERVE_PORT || '5555'

var peers = []

router.on('message', function(from, msg) {
  if(server){
    var sender = from.toString();
    if(peers.indexOf(sender) == -1){
      peers.push(sender)
    }
    for(peer in peers){
      router.send(peers[peer], sender + " " + msg.toString())
    }
  } else {
    console.log(msg.toString());
  }
})

router.identity = name
console.log("Logging in as", name)

var message  = '',
  lastuser = "towski",
  match    = null,
  server = false

process.stdin.on("data", function(buf) {
  if(buf[0] == 13) {
    var text = message.trim()
    message = ''
    if(text == '') return
    if(text == 'q') {
      console.log("Closing...")
      process.stdin.pause()
      router.close()
      process.kill()
    } else {
      if(server){
        for(peer in peers){
          router.send(peer, text)
        }
      } else {
        router.send("towski", text)
      }
    }
  } else {
    message += buf.toString()
  }
})

if(process.env.SERVE_PORT){
  server = true
  router.bind("tcp://*:5555", function() {
    process.stdin.resume()
  })
} else {
  router.connect("tcp://localhost:5555")
  process.stdin.resume()
} 


