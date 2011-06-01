// IM chat
// Binds a ROUTER socket on 5555

require('tty').setRawMode(true);

var context = require('zeromq'),
  sys = require('sys'),
  fs = require('fs'),
  mdns = require('mdns'),
  util = require('util'),
  router  = context.createSocket('router'),
  request     = context.createSocket('request'),
  reply     = context.createSocket('reply'),
  name    = process.env.NAME || process.env.USER,
  connect_port  = process.env.CONNECT_PORT || '5555',
  serve_port = process.env.SERVE_PORT || '5555',
  dmp = require('diff_match_patch')
  
  
var browser = mdns.createBrowser('http', 'tcp');
var foundServer = false,
  peers = [],
  message  = '',
  match    = null,
  server = false

browser.on('serviceUp', function(info, flags) {
  foundServer = true
});

browser.start();

router.identity = name

setTimeout(function(){ 
  if(foundServer){
    console.log("Logging in as", name)
    router.connect("tcp://localhost:5555")
    router.on('message', function(from, msg) {
      var dar = new dmp.diff_match_patch();
      try{
        console.log(msg.toString())
        var patch = JSON.parse(msg.toString())
        console.log(patch)
        fs.readFile('dakee.js', function(err, data){
          if(err)
            data = ""
          console.log(patch)
          var result = dar.patch_apply(patch, data) 
          fs.open("dakee.js", "w+", 0666, function(err, fd){
            console.log(result)
            buffer = new Buffer(result[0]);
            fs.write(fd, buffer, 0, buffer.length)
          })
        });
      }catch(e){
        console.log(e)
      }
    })
    router.send("towski","hey");
    console.log("resume")
    process.stdin.resume()
  } else {
    console.log("starting server", name)
    var ad = mdns.createAdvertisement('http', 4321)
    ad.start()
    server = true
    router.bind("tcp://*:5555", function() {
      process.stdin.resume()
    })
    router.on('message', function(from, msg) {
      var sender = from.toString();
      console.log("Peer joined: ", sender)
      if(peers.indexOf(sender) == -1){
        peers.push(sender)
      }
      for(peer in peers){
        router.send(peers[peer], sender + " " + msg.toString())
      }
    })
  } 
}, 1000)

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

      } else {
        router.send("towski", text)
      }
    }
  } else {
    message += buf.toString()
  }
})

fs.watchFile("dakee.js", function (curr, prev) {
  if(curr.mtime.getTime() != prev.mtime.getTime()){
    console.log("File changed, building diff")
    fs.readFile('dakee.js.old', function(err, data){
      var oldData;
      var dar = new dmp.diff_match_patch();
      if(err){
        oldData = ""
      }else{
        oldData = data.toString();
      }
      var newBuffer = fs.readFileSync('dakee.js');
      var patch = dar.patch_make(oldData, newBuffer.toString())
      fs.open("dakee.js.old", "w+", 0666, function(err, fd){
        buffer = new Buffer(newBuffer);
        fs.write(fd, buffer, 0, buffer.length)
      })
      console.log(peers)
      console.log(JSON.stringify(patch))
      for(peer in peers){
        router.send(peers[peer], JSON.stringify(patch))
      }
    })
  }
});

