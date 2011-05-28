// rick ip: 192.168.1.142
// towski ip: 192.168.1.25

require('tty').setRawMode(true);

var context = require('zeromq')
  , req     = context.createSocket('req')
  , rep     = context.createSocket('rep')
  , ip      = process.env.CLIENT_IP || '192.168.1.25'

var needsAnswer = false
rep.on('message', function(msg) {
  needsAnswer = true
  console.log('him:', msg.toString())
})

var message = ''
process.stdin.on("data", function(buf) {
  if(buf[0] == 13) {
    var text = message.trim()
    message = ''
    if(text == '') return
    if(text == 'q') {
      console.log("Closing...")
      process.stdin.pause()
      req.close()
      rep.close()
      process.exit()
    } else {
      (needsAnswer ? rep : req).send(text)
      needsAnswer = false
      console.log('you:', text)
    }
  } else {
    message += buf.toString()
  }
})

req.connect("tcp://" + ip + ":5555")
rep.bindSync("tcp://*:5555")

process.stdin.resume()

