const config = require("./nebula.conf");
const NEBULA = require("@nebula-contrib/nebula-nodejs");
const { dev } = require("../utils/tools");

const client = NEBULA.createClient(config);

dev.log("네뷸러 테스트 시작");
client.execute("show tags").then((response) => {
  console.log(response);
});

// client.execute("insert vertex if not exists test(name, age) values player5").then((response) => {
//   console.log(response);
// });

client
  .execute("lookup on player yield properties(vertex) as vertexs")
  .then((result) => {
    const { vertexs } = result.data;

    dev.log(vertexs);
  });

// client
//   .execute(`match (v:player{name: "kimson"}) return v as group`)
//   .then((result) => {
//     const { group } = result.data;
//     dev.log("group", group);
//     for (let item of group) {
//       dev.log("item", item);
//       for (let tag of item.tags) dev.log("tags", tag);
//     }
//   }).finally(() => {
//     client.
//   });

// client
//   .execute("GET SUBGRAPH 3 STEPS FROM -7897618527020261406", true)
//   .then((origin) => {
//     console.log(origin);
//   });

// connection is ready for executing command
client.on("ready", ({ sender }) => {
  dev.log("ready");
  // dev.log(sender);
});

// error occurs
client.on("error", ({ sender, error }) => {
  dev.log("error");
  // dev.log(sender);
  dev.log(error);
});

// connected event
client.on("connected", ({ sender }) => {
  dev.log("connected");
  // dev.log(sender);
});

// authorized successfully
client.on("authorized", ({ sender }) => {
  dev.log("authorized");
  // dev.log(sender);
});

// reconnecting
client.on("reconnecting", ({ sender, retryInfo }) => {
  dev.log("reconnecting");
  // dev.log(sender);
  // dev.log(retryInfo);
});

// closed
client.on("close", ({ sender }) => {
  dev.log("close");
  // dev.log(sender);
  // client.execute("show sessions").then((result) => {
  //   console.log(result);
  //   const { data } = result;
  //   const { SessionId } = data;
  //   // client.execute(`KILL QUERY (session=${},`)
  // });
});

process.on("SIGINT", () => {
  dev.log("sigint");
  client.close();
  process.exit();
});
