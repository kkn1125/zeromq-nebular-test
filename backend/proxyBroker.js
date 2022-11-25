//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

const zmq = require("zeromq");

async function runServer() {
  const sock = new zmq.Reply();

  await sock.bind("tcp://*:5555");

  for await (const [msg] of sock) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const decoded = decoder.decode(msg);
    const json = JSON.parse(decoded);
    console.log("[Server DEV] ::> Received: ", json.uuid);
    await sock.send(
      encoder.encode(
        JSON.stringify({
          ip: `${parseInt(Math.random() * 255)}.${parseInt(
            Math.random() * 255
          )}.${parseInt(Math.random() * 255)}.${parseInt(Math.random() * 255)}`,
          port: parseInt(Math.random() * 8999) + 1000,
        })
      )
    );
    // Do some 'work'
  }
}

runServer();
