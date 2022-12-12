const { dev } = require("../../../backend/utils/tools");
const Query = require("../models/Query");
const { convertRegionName } = require("../utils/tools");
const nebula = new Query();

const options = {
  limit: {
    locale: 10, // 로케일의 최대
    pool_publisher: 5, // 퍼블리셔의 최대
    pool_socket: 5, // 소켓의 최대
    space: 5, // space의 최대
    channel: 5, // 채널의 최대
  },
};

// 초기화부
Query.initialize = async (data) => {
  /* locales area */
  const userRegion = convertRegionName(data.locale);
  const isNotExistSocket = await nebula.exec(
    `MATCH (locale:locales) WHERE id(locale) STARTS WITH "${userRegion}" RETURN locale, CASE WHEN COUNT(locale) == 0 THEN true ELSE false END AS isNotExist`
  );
  const { locale, isNotExist } = isNotExistSocket.data;
  const localeInfo = locale[0];
  const isNotExistLocale = isNotExist[0];

  dev.alias("Locale Json Beautify").log(JSON.stringify(localeInfo, null, 2));
  // 로케일 없으면 생성
  if (isNotExistLocale || isNotExist.length === 0) {
    await nebula.exec(
      `INSERT VERTEX locales (limit) VALUES "${userRegion}":(${options.limit.locale})`
    );
  }
};

// 조회부
// Query.checkGraphs = async (data) => {
//   /* space area */
//   const initialSpace = await nebula.exec(
//     `MATCH (v:spaces) RETURN COUNT(v) AS space_count`
//   );

//   const { space_count } = initialSpace.data;

//   if (space_count[0] === 0) {
//     await nebula.exec(
//       `INSERT VERTEX spaces (limit, volume, owner) VALUES (${
//         options.limit.space
//       }, ${Math.random() * 50 + 50}, "admin")`
//     );
//   }

//   /* channel area */
//   const initialChannel = await nebula.exec(
//     `MATCH (v:channels) RETURN COUNT(v) AS channel_count`
//   );
//   const { channel_count } = initialChannel.data;
//   if (channel_count[0] === 0) {
//     await nebula.exec(
//       `INSERT VERTEX
//       channels (url, port, is_live, cpu_usage, memory_usage)
//       VALUES ("http://test.com", ${parseInt(Math.random() * 3000) + 3000}, ${
//         Math.random() * 100
//       }, ${Math.random() * 100})`
//     );
//   }

//   /* pool area */
//   const initialPoolSocket = await nebula.exec(
//     `MATCH (v:pool_sockets) RETURN COUNT(v) AS pool_socket_count`
//   );
//   const { pool_socket_count } = initialPoolSocket.data;
//   if (pool_socket_count[0] === 0) {
//     await nebula.exec(
//       `INSERT VERTEX pool_sockets (limit) VALUES (${options.limit.pool_socket})`
//     );
//   }
//   const initialPoolPublisher = await nebula.exec(
//     `MATCH (v:pool_publishers) RETURN COUNT(v) AS pool_publisher_count`
//   );
//   const { pool_publisher_count } = initialPoolPublisher.data;
//   if (pool_publisher_count[0] === 0) {
//     await nebula.exec(
//       `INSERT VERTEX pool_publishers (limit) VALUES (${options.limit.pool_socket})`
//     );
//   }
// };

// 생성부
Query.createVertex = async (data) => {
  // production 시 uuid 를 1pc 1uuid로 제한하는지? 매번 랜덤?
  // const userExists = await nebula.exec(
  //   `MATCH (user:users) WHERE id(user) == "${data.uuid}" RETURN user`
  // );
  // dev.alias("User Exists").log(userExists);

  // if (userExists.data.user.length === 0) {
  await nebula.exec(
    `INSERT VERTEX users (email) VALUES "${data.uuid}":("${data.email}")`
  );

  let isLocaleFull = true;
  let localIndex = null;

  const localeQuery = await await nebula.exec(
    `LOOKUP ON locales YIELD id(vertex) AS vid | GROUP BY $-.vid YIELD $-.vid AS vid | GO FROM $-.vid OVER include REVERSELY WHERE $-.vid STARTS WITH "${convertRegionName(
      data.locale
    )}" YIELD src(edge) AS connect_socket, dst(edge) AS dst | RETURN COLLECT($-.connect_socket) AS connect_socket, $-.dst AS locale`
    // `LOOKUP ON locales YIELD id(vertex) AS vid | GO FROM $-.vid OVER include REVERSELY WHERE $-.vid STARTS WITH "${convertRegionName(
    //   data.locale
    // )}" YIELD PROPERTIES($$) AS connect | RETURN $-.connect AS connect_socket, COUNT($-.connect) AS connect_count`
  );
  const { locale, connect_socket } = localeQuery.data;
  console.log(localeQuery);
  // for (let i = i; i < locale.length; i++) {
  //   if()
  // }

  const socketQuery = await nebula.exec(
    `MATCH (pool_sockets:pool_sockets)--() RETURN pool_sockets, id(pool_sockets) AS vid, CASE WHEN true THEN COUNT(pool_sockets) ELSE false END AS socket_count ORDER BY vid ASC`
  );
  const publisherQuery = await nebula.exec(
    `MATCH (pool_publishers:pool_publishers)--() RETURN pool_publishers, id(pool_publishers) AS vid, CASE WHEN true THEN COUNT(pool_publishers) ELSE false END AS publisher_count ORDER BY vid ASC`
  );

  const { pool_sockets, socket_count } = socketQuery.data;
  const { pool_publishers, publisher_count } = publisherQuery.data;

  let isSocketFull = true;
  let socketIndex = null;

  // 소켓 및 퍼블리셔 포트를 가져오는 방식이면 변경 가능성 염두에 두고 작업
  let exampleSocketIp = "192.168.254.16";
  let examplePublisherIp = "192.168.254.16";
  let examSocketPort = parseInt(Math.random() * 3000) + 3000;
  let examPublisherPort = parseInt(Math.random() * 3000) + 3000;
  let examCpuUsage = Math.random() * 100;
  let examMemoryUsage = Math.random() * 100;
  let socketVid = `socket${(socket_count[0] || 0) + 1}`;
  let publisherVid = `publisher${(publisher_count[0] || 0) + 1}`;

  await nebula.exec(
    `INSERT VERTEX pool_sockets (url, ip, port, is_live, cpu_usage, memory_usage) VALUES "${socketVid}":("http://test.com", "${exampleSocketIp}", ${examSocketPort}, true, ${examCpuUsage}, ${examMemoryUsage})`
  );
  await nebula.exec(
    `INSERT VERTEX pool_publishers (url, ip, port, is_live) VALUES "${publisherVid}":("http://test.com", "${examplePublisherIp}", ${examPublisherPort}, true)`
  );
  await nebula.exec(
    `INSERT EDGE include (sequence) VALUES "${socketVid}"->"${convertRegionName(
      data.locale
    )}":(${locale.length})`
  );
  await nebula.exec(
    `INSERT EDGE socket (port, is_connect) VALUES "${data.uuid}"->"${socketVid}":(${examSocketPort}, true)`
  );
  await nebula.exec(
    `INSERT EDGE pub (port, is_connect) VALUES "${data.uuid}"->"${publisherVid}":(${examPublisherPort}, true)`
  );

  const channelQuery = await nebula.exec(
    `LOOKUP ON channels YIELD PROPERTIES(vertex) AS channel, id(vertex) AS vid | GROUP BY $-.vid YIELD $-.vid AS vid | GO FROM $-.vid OVER allocation REVERSELY YIELD src(edge) as user, dst(edge) AS channel, $^ AS channels | RETURN $-.channels AS channels, COLLECT($-.user) AS users, COUNT($-.user) AS user_count | ORDER BY $-.channels`
  );

  const { channels, users, user_count } = channelQuery.data;
  let isChannelFull = true;
  let channelIndex = null;

  for (let i = 0; i < channels.length; i++) {
    // dev
    //   .alias("Locale Json Beautify")
    //   .log(JSON.stringify(channels[i], null, 2));
    if (user_count[i] < channels[i].tags[0].props.limit) {
      await nebula.exec(
        `INSERT EDGE allocation (type, status) VALUES "${data.uuid}"->"${channels[i].vid}":("viewer", true)`
      );
      isChannelFull = false;
      channelIndex = channels[i].vid;
      break;
    }
  }

  if (isChannelFull) {
    const channelVid = `channel${channels.length + 1}`;
    console.log("✅ full");
    await nebula.exec(
      `INSERT VERTEX channels (limit) VALUES "channel${channels.length + 1}":(${
        options.limit.channel
      })`
    );

    await nebula.exec(
      `INSERT EDGE allocation (type, status) VALUES "${data.uuid}"->"${channelVid}":("viewer", true)`
    );

    channelIndex = channelVid;
  }

  const spaceQuery = await nebula.exec(
    `LOOKUP ON spaces YIELD PROPERTIES(vertex) AS space, id(vertex) AS vid | GROUP BY $-.vid YIELD $-.vid AS vid | GO FROM $-.vid OVER attach REVERSELY YIELD src(edge) as channel, dst(edge) AS space, $^ AS spaces | RETURN $-.spaces AS spaces, COLLECT($-.channel) AS channels, COUNT($-.channel) AS channel_count | ORDER BY $-.spaces`
  );
  console.log("✅", spaceQuery);
  const { spaces, channels: spaceChannel, channel_count } = spaceQuery.data;
  let isSpaceFull = true;
  let spaceIndex = null;

  for (let i = 0; i < spaces.length; i++) {
    // dev
    //   .alias("Locale Json Beautify")
    //   .log(JSON.stringify(spaces[i], null, 2));
    if ((channel_count[i] || 0) < spaces[i].tags[0].props.limit) {
      await nebula.exec(
        `INSERT EDGE attach (sequence, type, activate) VALUES "${channelIndex}"->"${
          spaces[i].vid
        }":(${channel_count[i] || 0}, "space_name", true)`
      );
      isSpaceFull = false;
      spaceIndex = spaces[i].vid;
      break;
    }
  }

  if (isSpaceFull) {
    const spaceVid = `space${spaces.length + 1}`;
    console.log("✅ full");
    await nebula.exec(
      `INSERT VERTEX spaces (volume, owner, limit) VALUES "space${
        spaces.length + 1
      }":(${parseInt(Math.random() * 100) + 10}, "admin", ${
        options.limit.space
      })`
    );

    await nebula.exec(
      `INSERT EDGE attach (sequence, type, activate) VALUES "${channelIndex}"->"${spaceVid}":(${
        spaceVid.match(/[0-9]+/)[0]
      }, "space_name", true)`
    );

    spaceIndex = spaceVid;
  }

  return {
    socketIp: exampleSocketIp,
    publisherIp: examplePublisherIp,
    socketPort: examSocketPort,
    publisherPort: examPublisherPort,
  };
};

// 연결부
Query.connectWithEdges = async (data) => {
  const userRegion = convertRegionName(data.locale);
  // 유저에 연결된 소켓을 먼저 조회하고
  // 있으면 소켓이 로케일과 연결되었는지 확인
  // 없으면 소켓과 연결을 생성
  // 소켓이 로케일과 연결되었는지 확인
  // 없으면 로케일과 연결 생성

  // const isConnectRegion = await (
  //   await nebula.exec(
  //     `GO FROM "${userRegion}" OVER include YIELD PROPERTIES($$) AS locales`
  //   )
  // ).data;
};

Query.changeUserTypeToPlayer = async (data) => {
  
}

const queryService = Query;

module.exports = queryService;
