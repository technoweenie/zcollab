// IM chat
// Binds a ROUTER socket on 5555

require('tty').setRawMode(true);

var context = require('zeromq')
  , router  = context.createSocket('router')
  , name    = process.env.NAME || process.env.USER

router.on('message', function(from, msg) {
  console.log(from.toString() + ":", msg.toString())
})

function close() {
  console.log("Closing...")
  process.stdin.pause()
  router.close()
  process.exit()
}

router.identity = name
console.log("Logging in as", name)

var message  = ''
  , lastuser = null
  , match    = null

process.stdin.on("data", function(buf) {
  if(buf[0] == 13) {
    var text = message.trim()
    message = ''
    process.stdout.write("\n")
    if(text == '') return
    if(text == 'q') {
      close()
    } else if(match = text.match(/^join (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)) {
      router.connect("tcp://" + match[1] + ":5555")
      console.log("Connecting to", match[1])
    } else {
      match = text.match(/^((\w+): )?(.*)$/)
      if(match[2]) lastuser = match[2]
      if(lastuser)
        router.send(lastuser, match[3])
    }
  } else {
    if(message == '')
      process.stdout.write("> ")
    process.stdout.write(buf.toString())
    message += buf.toString()
  }
})

process.stdin.on('keypress', function(char, key) {
  if (key && key.ctrl && key.name == 'c') {
    close()
  }
})

router.bind("tcp://*:5555", function() {
  process.stdin.resume()
})
