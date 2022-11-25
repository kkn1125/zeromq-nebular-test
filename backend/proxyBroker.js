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
    console.log("[Server] Received ", json.uuid);
    await sock.send(
      encoder.encode(
        JSON.stringify({
          ip: "222.222.15.23",
          port: 3333,
        })
      )
    );
    // Do some 'work'
  }
}

runServer();
