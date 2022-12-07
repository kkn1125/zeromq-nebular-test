//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

const zmq = require("zeromq");
const { dev } = require("../backend/utils/tools");
const Query = require("./Query");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const channelLimit = 50;
const spaceLimit = 50;
const userLimit = 50;
const observerLimit = 50;
const managerLimit = 50;
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

const nebula = new Query();

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

  await nebula
    .type("TAG")
    .create()
    .index()
    .ifNotExists()
    .target("space")
    .exec();
  await nebula.type("TAG").rebuild("space").exec();
  await nebula
    .type("TAG")
    .create()
    .index()
    .ifNotExists()
    .target("channel")
    .exec();
  await nebula.type("TAG").rebuild("channel").exec();
  await nebula.type("TAG").create().index().ifNotExists().target("user").exec();
  await nebula.type("TAG").rebuild("user").exec();
  await nebula
    .type("EDGE")
    .create()
    .index()
    .ifNotExists()
    .target("allocation")
    .exec();
  await nebula.type("EDGE").rebuild("allocation").exec();
  await nebula
    .type("EDGE")
    .create()
    .index()
    .ifNotExists()
    .target("socket")
    .exec();
  await nebula.type("EDGE").rebuild("socket").exec();

  let spaces = await nebula
    .type("TAG")
    .lookup("space")
    .properties("space")
    .exec();
  let channels = await nebula
    .type("TAG")
    .lookup("channel")
    .properties("channel")
    .exec();
  let users = await nebula.type("TAG").lookup("user").properties("user").exec();
  let allocations = await nebula
    .type("EDGE")
    .lookup("allocation")
    .properties("allocation")
    .exec();

  spaceIndex = spaces.data.space.length + 1;
  channelIndex = channels.data.channel.length + 1;
  index = users.data.user.length + 1;

  dev.alias("test").log(spaces);
  if (spaces.data.space.length === 0) {
    // space 초기화
    dev.log("space count:", spaces.data.space.length);
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("space")
      .keys([
        "name",
        "volume",
        "owner",
        "max_users",
        "max_observers",
        "max_managers",
      ])
      .values(`space${spaceIndex}`, [
        `space${spaceIndex}`,
        0,
        "admin",
        userLimit,
        observerLimit,
        managerLimit,
      ])
      .exec();

    dev.log("created space");
    space = spaces.data.space.slice(-1)[0].kvs;
  } else {
    // space 여유공간 조회
    // for (let space of spaces.data.space) {
    //   space
    // }
    space = spaces.data.space.slice(-1)[0].kvs;
  }

  let countUserInChannel = 0;
  for (let channel of channels.data.channel) {
    const allocatedUser = await nebula.findConnectedNodes(channel.kvs.name);
    countUserInChannel = allocatedUser.data.NODES;
  }

  if (channels.data.channel.length === 0) {
    // channel 초기화
    dev.log("channel count:", channels.data.channel.length);
    nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("channel")
      .keys(["name"])
      .values(`channel${channelIndex}`, [`channel${channelIndex}`])
      .exec();
    dev.log("created channel");
    channelIndex++;
    channel = channels.data.channel.slice(-1)[0].kvs;
  } else if (countUserInChannel >= space.max_users) {
    // channel 여유공간 조회
    // for (let channel of channels.data.channel) {
    //   channel
    // }
    dev.log("channel count:", channels.data.channel.length);
    nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("channel")
      .keys(["name"])
      .values(`channel${channelIndex}`, [`channel${channelIndex}`])
      .exec();
    dev.log("created channel");
    channelIndex++;
    channel = channels.data.channel.slice(-1)[0].kvs;
  } else {
    channel = channels.data.channel.slice(-1)[0].kvs;
  }

  dev.alias("Allocation Check").log(allocations);

  if (data.type === "attach") {
    // space 검사 - space의 유저가 80%이상이면 생성
    // channel 검사 - channel의 유저가 맥스 넘어가면 채널 생성
    // 유저는 채널에 할당
    nebula
      .type("EDGE")
      .insert()
      .ifNotExists()
      .target("attach")
      .keys(["sequence", "type"])
      .values(
        [[channel.name, space.name]],
        [[space.name.match(/[0-9]+/)[0], "not_full"]]
      )
      .exec();

    const response = await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("user")
      .keys(["uuid", "email"])
      .values(`user${index}`, [data.uuid, createEmail()])
      .exec();
    dev.alias("User Inserted").log("ok");

    nebula
      .type("EDGE")
      .insert()
      .ifNotExists()
      .target("allocation")
      .keys(["type"])
      .values([[`user${index}`, `${channel.name}`]], [["viewer"]])
      .exec();
    dev.alias("Viewer Inserted").log("ok");

    index++;
    dev.preffix = "show tags";
    dev.log(response);
    returnData(sock, data);
  }
}

async function returnData(sock, data) {
  await sock.send(encoder.encode(JSON.stringify(data)));
}

/* index 번호 체크용 */
// setInterval(() => {
//   dev.alias("next user index").log(index);
//   dev.alias("next space index").log(spaceIndex);
//   dev.alias("next channel index").log(channelIndex);
// }, 3000);

runServer();
