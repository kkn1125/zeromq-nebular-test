//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

const zmq = require("zeromq");
const { dev } = require("../backend/utils/tools");
const Client = require("./nebula.db");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const client = new Client();
const channelLimit = 50;
const spaceLimit = 50;
let spaceIndex = 1;
let channelIndex = 1;
let index = 1;
const domains = [`naver.com`, `daum.net`, `google.com`];
const createEmail = () =>
  parseInt(Math.random() * 100_000)
    .toString()
    .split("")
    .map((str) => String.fromCharCode(97 + Number(str)))
    .join("") +
  "@" +
  domains[parseInt(Math.random() * 3)];
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
      dev.log(decoded);
      const json = JSON.parse(decoded);

      dev.preffix = "Server Received";
      dev.log(json);

      dataProcessor(sock, json);
    } catch (e) {
      console.log(e);
      dev.log("error");
    }
    // Do some 'work'
  }
}

async function dataProcessor(sock, data) {
  let space = null;
  let channel = null;
  if (data.type === "attach") {
    await client.execute(
      `CREATE TAG INDEX IF NOT EXISTS space_index ON space()`
    );
    await client.execute(`REBUILD TAG INDEX space_index`);

    await client.execute(
      `CREATE TAG INDEX IF NOT EXISTS channel_index ON channel()`
    );
    await client.execute(`REBUILD TAG INDEX channel_index`);
    const spaces = await client.execute(
      `LOOKUP ON space WHERE space.name != "" YIELD PROPERTIES(VERTEX) AS space`
    );
    const channels = await client.execute(
      `LOOKUP ON channel WHERE channel.name != "" YIELD PROPERTIES(VERTEX) AS channel`
    );

    space = spaces.data.space.slice(-1)[0];
    channel = channels.data.channel.slice(-1)[0];

    // space 초기화
    if (spaces.data.space.length === 0) {
      dev.log("space count:", spaces.data.space.length);
      await client.execute(
        `INSERT VERTEX IF NOT EXISTS space(name) VALUES "space${spaceIndex}": ("space${spaceIndex}")`
      );
      dev.log("created space");
    }
    // channel 초기화
    if (channels.data.channel.length === 0) {
      dev.log("channel count:", channels.data.channel.length);
      await client.execute(
        `
        INSERT VERTEX IF NOT EXISTS channel(name) VALUES "channel${channelIndex}": ("channel${channelIndex}")
        `
      );
      dev.log("created channel");
      channelIndex++;
    }

    if (spaces.data.space.length > spaceLimit) {
      await client.execute(
        `
        INSERT VERTEX IF NOT EXISTS space(name) VALUES "space${spaceIndex}": ("space${spaceIndex}")
        `
      );
      dev.log("created space");
      spaceIndex++;
    }

    if (channels.data.channel.length > channelLimit) {
      await client.execute(
        `
        INSERT VERTEX IF NOT EXISTS channel(name) VALUES "channel${channelIndex}": ("channel${channelIndex}")
        `
      );
      dev.log("created channel");
      channelIndex++;
    }

    await client.execute(
      `
      INSERT EDGE IF NOT EXISTS attach(sequence, type) VALUES "${channel.name}" -> "${space.name}":(1, "not_full")
      `
    );
    
    client
      .execute(
        `
      INSERT VERTEX
      user(uuid, email)
      VALUES "user${index}": ("${data.uuid}", "${createEmail()}")
      `
      )
      .then((response) => {
        console.log(response);
        client.execute(
          `
          INSERT EDGE
          allocation(type)
          VALUES "user${index}":
          `
        );
        index++;
        dev.preffix = "show tags";
        dev.log(response);
        returnData(sock, data);
      });
  }
}

async function returnData(sock, data) {
  await sock.send(encoder.encode(JSON.stringify(data)));
}

runServer();
