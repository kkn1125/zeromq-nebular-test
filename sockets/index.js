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
