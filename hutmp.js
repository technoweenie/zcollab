// Syncs dakee.js to all subscribed listeners.
// Binds a PUB socket on 5554
// Connects a SUB socket to IP specified by CLIENT_IP env var.

var zmq = require('zeromq');
var ip = process.env.CLIENT_IP
var fs = require('fs')

sub = zmq.createSocket('sub');
pub = zmq.createSocket('pub')

sub.subscribe("dakee.js")

sub.on('message', function(data) {
  data = data.slice("dakee.js \n".length)
  fs.open("dakee.js", "w+", 0666, function(err, fd){
    buffer = new Buffer(data);
    fs.write(fd, buffer, 0, buffer.length)
  })
});

sub.on('error', function(error) {
  console.log(error);
});

sub.connect('tcp://'+ip+':5554');
pub.bindSync("tcp://*:5554")

process.on('SIGINT', function () {
  console.log("Closing")
  fs.unwatchFile("dakee.js");
  sub.close()
  pub.close()
});

fs.watchFile("dakee.js", function (curr, prev) {
  pub.send("dakee.js \n" + fs.readFileSync('dakee.js').toString())
});