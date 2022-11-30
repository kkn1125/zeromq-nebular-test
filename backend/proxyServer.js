const zmq = require("zeromq");
const { dev } = require("./utils/tools");

async function runServer() {
  const sock = new zmq.Reply();

  await sock.bind("tcp://*:6666");

  for await (const [msg] of sock) {
    dev.log("Proxy Received " + ": [" + msg.toString() + "]");
    await sock.send("ok!");
    // Do some 'work'
  }
}

runServer();
