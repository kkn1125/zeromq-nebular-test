//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

const zmq = require("zeromq");
const { dev } = require("../backend/utils/tools");
const Query = require("./src/model/Query");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const limit = {
  locale: 1500, // 로케일의 최대
  pool_publisher: 50, // 퍼블리셔의 최대
  pool_socket: 50, // 소켓의 최대
  channel: 50, // space의 최대
  user: 50, // 채널의 최대
};
const indexing = {
  locale: 0,
  pool_publisher: 0,
  pool_socket: 0,
  space: 0,
  channel: 0,
};
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

async function initialize() {
  let space = null;
  let channel = null;

  // locales 생성
  // pool_sockets 생성
  // pool_publishers 생성
  // spaces 생성
  // channels 생성

  // limit 측정
  // pool_sockets limit가 80%이상이거나 없을 시 생성

  const locales = await (
    await nebula.exec(
      `MATCH (v:locales) RETURN COLLECT(v) AS locales, COUNT(v) AS count`
    )
  ).data;
  const poolSockets = await (
    await nebula.exec(
      `MATCH (v:pool_sockets) RETURN COLLECT(v) AS pool_sockets, COUNT(v) AS count`
    )
  ).data;
  const poolPublishers = await (
    await nebula.exec(
      `MATCH (v:pool_publishers) RETURN COLLECT(v) AS pool_publishers, COUNT(v) AS count`
    )
  ).data;
  const spaces = await (
    await nebula.exec(
      `MATCH (v:spaces) RETURN COLLECT(v) AS spaces, COUNT(v) AS count`
    )
  ).data;
  const channels = await (
    await nebula.exec(
      `MATCH (v:channels) RETURN COLLECT(v) AS channels, COUNT(v) AS count`
    )
  ).data;

  /* 각 버텍스 초기화 */
  if (locales.count[0] === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("locales")
      .keys(["limit"])
      .values(
        ["korea", [limit.locale]],
        ["america", [limit.locale]],
        ["japan", [limit.locale]]
      )
      .exec();
  }
  if (poolSockets.count[0] === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("pool_sockets")
      .keys(["url", "port", "is_live", "cpu_usage", "memory_usage"])
      .values([
        `socket${poolSockets.count + 1}`,
        [
          "http://test",
          parseInt(Math.random() * 1000) + 3000,
          true,
          (Math.random() * 100).toFixed(3),
          (Math.random() * 100).toFixed(3),
        ],
      ])
      .exec();
  } else {
    console.log("✅", poolSockets.pool_sockets);
    console.log(
      "✅",
      poolSockets.pool_sockets[0].vid,
      poolSockets.pool_sockets[0].tags
    );
  }
  if (poolPublishers.count[0] === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("pool_publishers")
      .keys(["url", "port", "is_live"])
      .values([
        `publisher${poolPublishers.count + 1}`,
        ["http://test", parseInt(Math.random() * 1000) + 3000, true],
      ])
      .exec();
  }
  if (spaces.count[0] === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("spaces")
      .keys(["name", "volume", "owner", "limit"])
      .values([
        `space${spaces.count + 1}`,
        [`space${spaces.count + 1}`, 0, "admin", limit.channel],
      ])
      .exec();
  }
  if (channels.count[0] === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("channels")
      .keys(["limit"])
      .values([`channel${channels.count + 1}`, [limit.user]])
      .exec();
  } else {
    for (let ch of channels.channels) {
      const result = await (
        await nebula.exec(
          `GO FROM "channel1" OVER allocation REVERSELY YIELD id($$) AS user_vid, PROPERTIES($$) AS users, id($^) AS channel_vid | RETURN collect($-.user_vid) AS user_vid, collect($-.users) AS users, collect($-.channel_vid) AS channel_vid`
        )
      ).data;

      if (result.end.length >= limit.user) {
      }
    }
    // channels.channels[0].vid
    // await nebula.exec(
    //   `GO FROM "channel1" OVER allocation REVERSELY YIELD PROPERTIES(edge) AS id, PROPERTIES($$)`
    // );
    // await nebula.exec(`GO FROM "channel1" OVER allocation REVERSELY YIELD properties($^) as start, properties(edge) as middle, properties($$) as end limit [5] | GROUP BY $-.start YIELD collect($-.start) as starts, collect($-.middle) as middles, collect($-.end) as ends`);
  }

  // await nebula.exec(
  //   `GO FROM "channel${channelIndex}" OVER allocation REVERSELY YIELD PROPERTIES($$)`
  // );

  // dev.alias("Allocation Check").log(allocations);
}

async function dataProcessor(sock, data) {
  await initialize();

  // if (data.type === "attach") {
  //   const spaces = await nebula
  //     .type("TAG")
  //     .match()
  //     .vertex("spaces")
  //     .returns("spaces")
  //     .exec();
  //   const channels = await nebula
  //     .type("TAG")
  //     .match()
  //     .vertex("channels")
  //     .returns("channels")
  //     .exec();
  //   const space = spaces.data.spaces.slice(-1)[0];
  //   const channel = channels.data.channels.slice(-1)[0];

  //   // TODO: space 검사 - space의 유저가 80%이상이면 생성
  //   // TODO: channel 검사 - channel의 유저가 맥스 넘어가면 채널 생성
  //   // TODO: 유저는 채널에 할당

  //   await nebula
  //     .type("EDGE")
  //     .insert()
  //     .ifNotExists()
  //     .target("attach")
  //     .keys(["sequence", "type"])
  //     .values(
  //       [[channel.vid, /* -> */ space.vid]],
  //       [[Number(space.vid.match(/[0-9]+/)[0]), "not_full"]]
  //     )
  //     .exec();
  //   await nebula
  //     .type("TAG")
  //     .insert()
  //     .ifNotExists()
  //     .target("users")
  //     .keys(["uuid", "email"])
  //     .values([`user${index}`, [data.uuid, createEmail()]])
  //     .exec();
  //   // dev.alias("User Inserted").log("ok");
  //   await nebula
  //     .type("EDGE")
  //     .insert()
  //     .ifNotExists()
  //     .target("allocation")
  //     .keys(["type", "status"])
  //     .values(
  //       [[`user${index}`, `${channels.data.channels.slice(-1)[0].vid}`]],
  //       [["viewer", true]]
  //     )
  //     .exec();
  //   // dev.alias("Viewer Inserted").log("ok");

  //   index++;
  //   returnData(sock, data);
  // }
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
