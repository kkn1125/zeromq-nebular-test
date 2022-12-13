const zmq = require("zeromq");
const uWs = require("uWebSockets.js");
const path = require("path");
const dotenv = require("dotenv");
const mode = process.env.NODE_ENV;

dotenv.config({
  path: path.join(__dirname, ".env"),
});
dotenv.config({
  path: path.join(__dirname, `.env.${mode}`),
});
console.log(process.env.HOST);
const port = Number(process.env.PORT);
const ZERO_SERVER_HOST = Number(process.env.ZERO_SERVER_HOST);
const ZERO_SERVER_PORT = Number(process.env.ZERO_SERVER_PORT);
const ZERO_CLIENT_HOST = Number(process.env.ZERO_CLIENT_HOST);
const ZERO_CLIENT_PORT = Number(process.env.ZERO_CLIENT_PORT);

async function runServer() {
  const sock = new zmq.Reply();

  await sock.bind(`tcp://*:${ZERO_SERVER_PORT}`);

  for await (const [msg] of sock) {
    console.log("Received " + ": [" + msg.toString() + "]");
    await sock.send("World");
    // Do some 'work'
  }
}

runServer();

async function runClient() {
  console.log("Connecting to hello world server…");

  //  Socket to talk to server
  const sock = new zmq.Request();
  sock.connect(`tcp://${ZERO_CLIENT_HOST}:${ZERO_CLIENT_PORT}`);

  for (let i = 0; i < 10; i++) {
    console.log("Sending Hello ", i);
    await sock.send("Hello");
    const [result] = await sock.receive();
    console.log("Received ", result.toString(), i);
  }
}

runClient();

const app = uWs
  ./*SSL*/ App({
    /* key_file_name: "misc/key.pem",
    cert_file_name: "misc/cert.pem",
    passphrase: "1234", */
  })
  .ws("/*", {
    /* Options */
    compression: uWs.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 32,
    /* Handlers */
    upgrade: (res, req, context) => {
      console.log(
        "An Http connection wants to become WebSocket, URL: " +
          req.getUrl() +
          "!"
      );

      /* This immediately calls open handler, you must not use res after this call */
      res.upgrade(
        {
          url: req.getUrl(),
        },
        /* Spell these correctly */
        req.getHeader("sec-websocket-key"),
        req.getHeader("sec-websocket-protocol"),
        req.getHeader("sec-websocket-extensions"),
        context
      );
    },
    open: (ws) => {
      console.log("A WebSocket connected with URL: " + ws.url);
    },
    message: (ws, message, isBinary) => {
      /* Ok is false if backpressure was built up, wait for drain */
      let ok = ws.send(message, isBinary);
      console.log(message);
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      console.log("WebSocket closed");
    },
  })
  .listen(port, (token) => {
    if (token) {
      console.log("Listening to port " + port);
    } else {
      console.log("Failed to listen to port " + port);
    }
  });
