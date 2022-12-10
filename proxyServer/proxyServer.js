//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

// TODO: 로케일부터 스페이스까지 0개 아닐 시 증가시키는 로직 및 현재 연결가능한 아이템들 저장해놓고 사용할 수 있도록 해야 함 2022-12-10 17:36:07 | kkn

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

async function initialize(data) {
  // locales 생성
  // pool_sockets 생성
  // pool_publishers 생성
  // spaces 생성
  // channels 생성

  // limit 측정
  // pool_socket limit가 80%이상인지?

  const locales = await (
    await nebula.exec(
      `MATCH (v:locales) RETURN COLLECT(v) AS locales, COUNT(v) AS count`
    )
  ).data;
  nebula.saveInfo("locales", locales);
  const poolSockets = await (
    await nebula.exec(
      `MATCH (v:pool_sockets) RETURN COLLECT(v) AS pool_sockets, COUNT(v) AS count`
    )
  ).data;
  nebula.saveInfo("pool_sockets", poolSockets);
  const poolPublishers = await (
    await nebula.exec(
      `MATCH (v:pool_publishers) RETURN COLLECT(v) AS pool_publishers, COUNT(v) AS count`
    )
  ).data;
  nebula.saveInfo("pool_publishers", poolPublishers);
  const spaces = await (
    await nebula.exec(
      `MATCH (v:spaces) RETURN COLLECT(v) AS spaces, COUNT(v) AS count`
    )
  ).data;
  nebula.saveInfo("spaces", spaces);
  const channels = await (
    await nebula.exec(
      `MATCH (v:channels) RETURN COLLECT(v) AS channels, COUNT(v) AS count`
    )
  ).data;
  nebula.saveInfo("channels", channels);

  /* 각 버텍스 초기화 */
  if (Number(locales.count[0]) === 0) {
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
    nebula.saveTypes("locales", ["korea", "america", "japan"]);
  }
  if (Number(poolSockets.count[0]) === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("pool_sockets")
      .keys(["url", "port", "is_live", "cpu_usage", "memory_usage"])
      .values([
        `socket${Number(poolSockets.count[0]) + 1}`,
        [
          "http://test",
          parseInt(Math.random() * 1000) + 3000,
          true,
          (Math.random() * 100).toFixed(3),
          (Math.random() * 100).toFixed(3),
        ],
      ])
      .exec();
    nebula.saveVid("pool_sockets", `socket${Number(poolSockets.count[0]) + 1}`);
    await nebula.exec(
      `INSERT EDGE include(sequence) VALUES "${nebula.getVid(
        "pool_sockets"
      )}"->"${data.locale === "ko" ? "korea" : "none"}":(${
        Number(nebula.getInfo("channels").count[0]) + 1
      })`
    );
  }
  if (Number(poolPublishers.count[0]) === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("pool_publishers")
      .keys(["url", "port", "is_live"])
      .values([
        `publisher${Number(poolPublishers.count[0]) + 1}`,
        ["http://test", parseInt(Math.random() * 1000) + 3000, true],
      ])
      .exec();
    nebula.saveVid(
      "pool_publishers",
      `publisher${Number(poolPublishers.count[0]) + 1}`
    );
  }
  if (Number(spaces.count[0]) === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("spaces")
      .keys(["name", "volume", "owner", "limit"])
      .values([
        `space${Number(spaces.count[0]) + 1}`,
        [`space${Number(spaces.count[0]) + 1}`, 0, "admin", limit.channel],
      ])
      .exec();
    nebula.saveVid("spaces", `space${Number(spaces.count[0]) + 1}`);
  }
  if (Number(channels.count[0]) === 0) {
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("channels")
      .keys(["limit"])
      .values([`channel${Number(channels.count[0]) + 1}`, [limit.user]])
      .exec();

    nebula.saveVid("channels", `channel${Number(channels.count[0]) + 1}`);

    await nebula
      .type("EDGE")
      .insert()
      .ifNotExists()
      .target("attach")
      .keys(["sequence", "type", "activate"])
      .values(
        [[nebula.getVid("channels"), /* -> */ nebula.getVid("spaces")]],
        [[Number(nebula.getVid("spaces").match(/[0-9]+/)[0]), "normal", true]]
      )
      .exec();
  }
}

async function checkChannelVolume(data) {
  const channels = nebula.getInfo("channels");

  /* 현재 여유공간의 사용자 인원 */
  const users = await (
    await nebula.exec(
      `MATCH (v:channels)<-[e:allocation]-(v2:users) WHERE id(v) == "${nebula.getVid(
        "channels"
      )}" RETURN COLLECT(v2) AS users, COUNT(v2) AS count`
    )
  ).data;
  nebula.saveInfo("users", users);

  if (channels.count[0] > 0) {
    /* 80%이상이면 새로 생성 */
    let isOver8Pct = true;
    for (let ch of channels.channels) {
      const result = await (
        await nebula.exec(
          `GO FROM "${ch.vid}" OVER allocation REVERSELY YIELD id($$) AS user_vid, PROPERTIES($$) AS users, id($^) AS channel_vid | RETURN collect($-.user_vid) AS user_vid, collect($-.users) AS users, collect($-.channel_vid) AS channel_vid, CASE WHEN count($-.users) >= 50 * 0.8 THEN true ELSE false END AS is_over_8pct`
        )
      ).data;

      /* 채널이 하나라도 80%를 넘지 않는다면 비어있는 채널명을 인덱싱에 저장한다. */
      if (!result.is_over_8pct[0]) {
        dev.alias("NOT FULL CHANNEL").log(ch.vid);
        isOver8Pct = false;
        nebula.saveVid("channels", ch.vid);
        break;
      }
    }

    /* 전체 채널이 80%이상이면 채널을 생성한다. */
    if (isOver8Pct) {
      await nebula
        .type("TAG")
        .insert()
        .ifNotExists()
        .target("channels")
        .keys(["limit"])
        .values([Number(nebula.getInfo("channels").count[0]) + 1, [limit.user]])
        .exec();

      await nebula
        .type("EDGE")
        .insert()
        .ifNotExists()
        .target("attach")
        .keys(["sequence", "type", "activate"])
        .values(
          [[nebula.getVid("channels"), /* -> */ nebula.getVid("spaces")]],
          [[Number(nebula.getVid("spaces").match(/[0-9]+/)[0]), "normal", true]]
        )
        .exec();
    }
  }

  /* 사용자 생성 */
  const isExistsUser = await (
    await nebula.exec(
      `MATCH (v:users) WHERE PROPERTIES(v).uuid == "${data.uuid}" RETURN v as user;`
    )
  ).data;

  if (isExistsUser.user.length === 0) {
    const nextUserVid = nebula.getNextVid("users");
    await nebula
      .type("TAG")
      .insert()
      .ifNotExists()
      .target("users")
      .keys(["uuid", "email"])
      .values([nextUserVid, [data.uuid, data.email]])
      .exec();

    await nebula
      .type("EDGE")
      .insert()
      .ifNotExists()
      .target("allocation")
      .keys(["type", "status"])
      .values(
        [[nextUserVid, /* -> */ nebula.getVid("channels")]],
        [["viewer", true]]
      )
      .exec();

    const currentSocket = await (
      await nebula.exec(
        `MATCH (v:pool_sockets) WHERE id(v) == "${nebula.getVid(
          "pool_sockets"
        )}" return v as socket`
      )
    ).data;
    const port = Number(currentSocket.socket[0].tags[0].props.port);
    console.log("✳️", port);

    await nebula
      .type("EDGE")
      .insert()
      .ifNotExists()
      .target("socket")
      .keys(["port", "is_connect"])
      .values([[nextUserVid, nebula.getVid("pool_sockets")]], [[port, true]])
      .exec();
  } else {
    nebula.saveVid("users", isExistsUser.user[0].vid);
    dev.alias("ALREADY USER EXISTS").log(nebula.getVid("users"));
  }
}

async function dataProcessor(sock, data) {
  await initialize(data);
  if (data.type === "attach") {
    await checkChannelVolume(data);
    // attach 타입 일 때 user를 소켓에 연결시킨다.
    // 연결시킬 때 풀 소켓의 용량을 점검한다.

    // 사용자를 연결시킨다.
  }

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
