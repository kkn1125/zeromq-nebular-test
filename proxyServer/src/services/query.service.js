// 추후 리팩토링 예정 - 2022-12-13 13:10:30

const { dev } = require("../../../backend/utils/tools");
const Query = require("../models/Query");
const { convertRegionName } = require("../utils/tools");
const nebula = new Query();

const options = {
  ip: {
    socket: "192.168.254.16",
    publisher: "192.168.254.16",
  },
  port: {
    socket: 10000,
    subscriber: 30000,
    publisher: 45000,
  },
  limit: {
    locale: 10, // 로케일의 최대
    pool_publisher: 50, // 퍼블리셔의 최대
    pool_socket: 50, // 소켓의 최대
    space: 5, // space의 최대
    channel: 50, // 채널의 최대
  },
};

// 초기화부
Query.initialize = async (data) => {
  /* locales area */
  const userRegion = convertRegionName(data.locale);
  const isNotExistSocket = await nebula.exec(
    `MATCH (locale:locales) WHERE id(locale) STARTS WITH "${userRegion}" RETURN locale, CASE WHEN COUNT(locale) == 0 THEN true ELSE false END AS isNotExist`
  );
  const isOverLocales = await nebula.exec(
    `MATCH (locale:locales)-[e:include]-() WHERE id(locale) STARTS WITH "${userRegion}" RETURN locale, CASE WHEN COUNT(e) > ${options.limit.locale} THEN true ELSE false END AS overLocale`
  );
  const { locale, isNotExist } = isNotExistSocket.data;
  const { overLocale } = isOverLocales.data;
  const localeInfo = locale[0];
  const isNotExistLocale = isNotExist[0];

  dev.alias("Locale Json Beautify").log(JSON.stringify(localeInfo, null, 2));
  // 로케일 없으면 생성
  if (isNotExistLocale || isNotExist.length === 0) {
    await nebula.exec(
      `INSERT VERTEX locales (limit) VALUES "${userRegion}${
        locale.length + 1
      }":(${options.limit.locale})`
    );
  }
  if (overLocale[0]) {
    await nebula.exec(
      `INSERT VERTEX locales (limit) VALUES "${userRegion}${
        locale.length + 1
      }":(${options.limit.locale})`
    );
  }
};

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
  console.log("✨ user insert", data.uuid);

  const localeQuery = await await nebula.exec(
    `LOOKUP ON locales YIELD id(vertex) AS vid | GROUP BY $-.vid YIELD $-.vid AS vid | GO FROM $-.vid OVER include REVERSELY WHERE $-.vid STARTS WITH "${convertRegionName(
      data.locale
    )}" YIELD src(edge) AS connect_socket, dst(edge) AS dst | RETURN COLLECT($-.connect_socket) AS connect_socket, $-.dst AS locale`
  );
  const { locale, connect_socket } = localeQuery.data;

  let socketQuery = await nebula.exec(
    `MATCH (pool_sockets:pool_sockets)-[e:socket]-() RETURN pool_sockets, id(pool_sockets) AS socket_vid, COUNT(pool_sockets) AS socket_count, CASE WHEN COUNT(pool_sockets) > ${
      options.limit.pool_socket * 0.8
    } THEN true ELSE false END AS is_over_limit_socket ORDER BY socket_vid ASC`
  );
  let publisherQuery = await nebula.exec(
    `MATCH (pool_publishers:pool_publishers)-[e:pub]-() RETURN pool_publishers, id(pool_publishers) AS publisher_vid, COUNT(pool_publishers) AS publisher_count, CASE WHEN COUNT(pool_publishers) > ${
      options.limit.pool_publisher * 0.8
    } THEN true ELSE false END AS is_over_limit_publisher ORDER BY publisher_vid ASC`
  );

  let { pool_sockets, socket_vid, socket_count, is_over_limit_socket } =
    socketQuery.data;
  let {
    pool_publishers,
    publisher_vid,
    publisher_count,
    is_over_limit_publisher,
  } = publisherQuery.data;

  // 소켓 및 퍼블리셔 포트를 가져오는 방식이면 변경 가능성 염두에 두고 작업
  let exampleSocketIp = "192.168.254.16";
  let examplePublisherIp = "192.168.254.16";
  let examSocketPort = 10000;
  let examPublisherPort = 45000;
  let examCpuUsage = Math.random() * 100;
  let examMemoryUsage = Math.random() * 100;
  let socketOver = true;
  let publisherOver = true;
  const returnPoolInfo = {
    socket: {
      ip: "",
      port: 0,
    },
    pub: {
      ip: "",
      port: 0,
    },
  };

  for (let i = 0; i < pool_sockets.length; i++) {
    if (!is_over_limit_socket[i]) {
      socketOver = false;
      break;
    }
  }
  for (let i = 0; i < pool_publishers.length; i++) {
    if (!is_over_limit_publisher[i]) {
      publisherOver = false;
      break;
    }
  }

  if (socketOver) {
    dev.alias("SOCKET LIMIT").log("socket is over 80% !!");
    await nebula.exec(
      `INSERT VERTEX pool_sockets (url, ip, port, is_live, cpu_usage, memory_usage) VALUES "socket${
        pool_sockets.length + 1
      }":("http://test.com", "${exampleSocketIp}", ${examSocketPort}, true, ${examCpuUsage}, ${examMemoryUsage})`
    );
    await nebula.exec(
      `INSERT EDGE IF NOT EXISTS include (sequence) VALUES "socket${
        pool_sockets.length + 1
      }"->"${convertRegionName(data.locale)}${locale.length}":(${
        locale.length
      })`
    );
    await nebula.exec(
      `INSERT EDGE IF NOT EXISTS socket (port, is_connect) VALUES "${
        data.uuid
      }"->"socket${pool_sockets.length + 1}":(${
        examSocketPort + pool_sockets.length
      }, true)`
    );
    returnPoolInfo.socket.ip = exampleSocketIp;
    returnPoolInfo.socket.port = examSocketPort + pool_sockets.length;
  }

  if (publisherOver) {
    dev.alias("PUBLISHER LIMIT").log("publisher is over 80% !!");
    await nebula.exec(
      `INSERT VERTEX pool_publishers (url, ip, port, is_live) VALUES "publisher${
        pool_publishers.length + 1
      }":("http://test.com", "${examplePublisherIp}", ${examPublisherPort}, true)`
    );
    await nebula.exec(
      `INSERT EDGE IF NOT EXISTS pub (port, is_connect) VALUES "${
        data.uuid
      }"->"publisher${pool_publishers.length + 1}":(${
        examPublisherPort + pool_publishers.length
      }, true)`
    );
    returnPoolInfo.pub.ip = examplePublisherIp;
    returnPoolInfo.pub.port = examPublisherPort + pool_publishers.length;
  }

  for (let i = 0; i < pool_sockets.length; i++) {
    const socket = pool_sockets[i];
    const count = socket_count[i];
    if (count < options.limit.pool_socket) {
      dev.alias("SOCKET LIMIT").log("socket is not over 80% !!");
      dev.alias("SOCKET LIMIT").log(socket.vid);
      dev.alias("SOCKET LIMIT").log(count);

      const { exist } = await (
        await nebula.exec(
          `MATCH (exist:pool_sockets)-[e:socket]-() WHERE dst(e) == "${socket.vid}" RETURN exist`
        )
      ).data;

      if (exist.length === 0 || !socketOver) {
        await nebula.exec(
          `INSERT EDGE IF NOT EXISTS socket (port, is_connect) VALUES "${
            data.uuid
          }"->"${socket.vid}":(${socket.tags[0].props.port + i + 1}, true)`
        );
        console.log("👁‍🗨️", JSON.stringify(socket, null, 2));
        returnPoolInfo.socket.ip = socket.tags[0].props.ip;
        returnPoolInfo.socket.port = socket.tags[0].props.port + i;
      }
      break;
    }
  }

  for (let i = 0; i < pool_publishers.length; i++) {
    const publisher = pool_publishers[i];
    const count = publisher_count[i];
    if (count < options.limit.pool_publisher) {
      dev.alias("PUBLISHER LIMIT").log("publisher is not over 80% !!");
      dev.alias("PUBLISHER LIMIT").log(publisher.vid);
      dev.alias("PUBLISHER LIMIT").log(count);

      const { exist } = await (
        await nebula.exec(
          `MATCH (exist:pool_publishers)-[e:pub]-() WHERE dst(e) == "${publisher.vid}" RETURN exist`
        )
      ).data;

      if (exist.length === 0 || !publisherOver) {
        await nebula.exec(
          `INSERT EDGE IF NOT EXISTS pub (port, is_connect) VALUES "${
            data.uuid
          }"->"${publisher.vid}":(${
            publisher.tags[0].props.port + i + 1
          }, true)`
        );
        console.log("👁‍🗨️", JSON.stringify(publisher, null, 2));
        returnPoolInfo.pub.ip = publisher.tags[0].props.ip;
        returnPoolInfo.pub.port = publisher.tags[0].props.port + i;
      }

      break;
    }
  }

  const channelQuery = await nebula.exec(
    `LOOKUP ON channels YIELD PROPERTIES(vertex) AS channel, id(vertex) AS vid | GROUP BY $-.vid YIELD $-.vid AS vid | GO FROM $-.vid OVER allocation REVERSELY YIELD src(edge) as user, dst(edge) AS channel, $^ AS channels | RETURN $-.channels AS channels, COLLECT($-.user) AS users, COUNT($-.user) AS user_count | ORDER BY $-.channels`
  );

  const { channels, users, user_count } = channelQuery.data;
  let isChannelFull = true;
  let channelIndex = null;

  for (let i = 0; i < channels.length; i++) {
    if (user_count[i] < channels[i].tags[0].props.limit * 0.8) {
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

  console.log("👁‍🗨️", JSON.stringify(returnPoolInfo, null, 2));
  return {
    socketIp: returnPoolInfo.socket.ip,
    publisherIp: returnPoolInfo.pub.ip,
    socketPort: returnPoolInfo.socket.port,
    publisherPort: returnPoolInfo.pub.port,
  };
};

Query.changeUserTypeToPlayer = async (data) => {
  const userQuery = await nebula.exec(
    `MATCH (user:users)-[alloc:allocation]-() WHERE id(user) == "${data.uuid}" RETURN user, alloc`
  );
  const { user, alloc } = userQuery.data;

  if (alloc.length === 0) return null;
  const allocation = alloc[0];
  const userVid = allocation.src;
  const channelVid = allocation.dst;
  const userProps = user[0].tags[0].props;
  console.log("✨ change user type to player check:", userVid, userProps);

  await nebula.exec(
    `UPDATE EDGE ON allocation "${userVid}"->"${channelVid}" SET type = "player" WHEN type == "viewer" YIELD type`
  );
};

Query.logoutUser = async (data) => {};

const queryService = Query;

module.exports = queryService;
