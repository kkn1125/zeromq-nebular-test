//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

const zmq = require("zeromq");
const { dev } = require("../backend/utils/tools");
const Query = require("./src/model/Query");
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

// nebula
//   .type("TAG")
//   .matchFrom("channels")
//   .exec()
//   .then((result) => {
//     console.log(result);
//   });

// nebula
//   .type("TAG")
//   .matchFrom("channels")
//   .edge("attach")
//   .matchTo("spaces")
//   .exec()
//   .then((result) => {
//     console.log(result);
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

  let spaces = await nebula
    .type("TAG")
    .lookup("spaces")
    .properties("space")
    .exec();
  // let channels = await nebula
  //   .type("TAG")
  //   .lookup("channels")
  //   .properties("channel")
  //   .exec();
  let channels = await nebula
    .type("TAG")
    .returns("channels")
    .match("users", "allocation", "channels")
    .exec();
  let users = await nebula
    .type("TAG")
    .lookup("users")
    .properties("user")
    .exec();
  let allocations = await nebula
    .type("EDGE")
    .lookup("allocation")
    .properties("allocation")
    .exec();

  spaceIndex = spaces.data.space.length + 1;
  channelIndex = channels.data.channels.length + 1;
  index = users.data.user.length + 1;

  dev.alias("test").log(spaces);
  if (spaces.data.space.length === 0) {
    // space 초기화
    dev.log("space count:", spaces.data.space.length);
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("spaces")
      .keys(["name", "volume", "owner", "limit_users", "limit_channels"])
      .values(`space${spaceIndex}`, [
        `space${spaceIndex}`,
        0,
        "admin",
        userLimit,
        channelLimit,
      ])
      .exec();

    dev.log("created space");
    space = (
      await nebula.type("TAG").lookup("spaces").properties("space").exec()
    ).data.space.slice(-1)[0].kvs;
    console.log(space);
  } else {
    // space 여유공간 조회
    // for (let space of spaces.data.space) {
    //   space
    // }
    space = spaces.data.space.slice(-1)[0].kvs;
  }

  let countUserInChannel = 0;
  for (let channel of channels.data.channels) {
    const allocatedUser = await nebula.subgraph(channel.vid).exec();
    dev.log(allocatedUser);
    countUserInChannel = allocatedUser.data.NODES;
  }

  if (channels.data.channels.length === 0) {
    // channel 초기화
    dev.log("channel count:", channels.data.channels.length);
    nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("channels")
      .keys(["limit"])
      .values(`channel${channelIndex}`, [channelLimit])
      .exec();
    dev.log("created channel");
    channelIndex++;
    channel = (
      await nebula.type("TAG").lookup("channels").properties("channel").exec()
    ).data.channel.slice(-1)[0];
    console.log(channel);
  } else if (countUserInChannel >= space.max_users) {
    // channel 여유공간 조회
    // for (let channel of channels.data.channels) {
    //   channel
    // }
    dev.log("channel count:", channels.data.channels.length);
    nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("channels")
      .keys(["limit"])
      .values(`channel${channelIndex}`, [channelLimit])
      .exec();
    dev.log("created channel");
    channelIndex++;
    channel = channels.data.channels.slice(-1)[0];
  } else {
    channel = channels.data.channels.slice(-1)[0];
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
        [[channel.vid, /* -> */ space.name]],
        [[Number(space.name.match(/[0-9]+/)[0]), "not_full"]]
      )
      .exec();

    const response = await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("users")
      .keys(["uuid", "email"])
      .values(`user${index}`, [data.uuid, createEmail()])
      .exec();
    dev.alias("User Inserted").log("ok");
    nebula
      .type("EDGE")
      .insert()
      .ifNotExists()
      .target("allocation")
      .keys(["type", "status"])
      .values(
        [[`user${index}`, `${channels.data.channels.slice(-1)[0].vid}`]],
        [["viewer", true]]
      )
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
