//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

const zmq = require("zeromq");
const { dev } = require("../backend/utils/tools");
const Client = require("./nebula.db");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const client = new Client();
// console.log(client);

// client.execute("show tags").then((response) => {
//   dev.preffix = "show tags";
//   dev.log(response);
// });

// client
//   .execute("lookup on player yield properties(vertex) as vertexs")
//   .then((result) => {
//     const { vertexs } = result.data;
//     dev.preffix = "execute";
//     dev.log(vertexs);
//   });

async function runServer() {
  const sock = new zmq.Reply();

  await sock.bind("tcp://*:5555");

  for await (const [msg] of sock) {
    try {
      const decoded = decoder.decode(msg);
      const json = JSON.parse(decoded);

      dev.preffix = "Server Received";
      dev.log(json);

      dataProcessor(sock, json);
    } catch (e) {
      dev.log("error");
    }
    // Do some 'work'
  }
}

function dataProcessor(sock, data) {
  if (data.type === "attach") {
    // client
    //   .execute(
    //     `
    //     INSERT VERTEX IF NOT EXISTS
    //     player(name, age)
    //     VALUES "${data.uuid}:("viewer")"
    //     `
    //   )
    //   .then((response) => {
    //     dev.preffix = "show tags";
    //     dev.log(response);
    //     returnData(sock, data);
    //   });
  }
}

async function returnData(sock, data) {
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
}

runServer();
