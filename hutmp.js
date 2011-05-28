var zmq = require('zeromq');
var ip = process.env.CLIENT_IP
var fs = require('fs')

sub = zmq.createSocket('sub');
pub = zmq.createSocket('pub')

sub.subscribe("dakee.js")

sub.on('message', function(data) {
  console.log(data.toString());
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
