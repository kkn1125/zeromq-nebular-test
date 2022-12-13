//  Hello World server
//  Binds REP socket to tcp://*:5555
//  Expects "Hello" from client, replies with "World"

// TODO: 로케일부터 스페이스까지 0개 아닐 시 증가시키는 로직 및 현재 연결가능한 아이템들 저장해놓고 사용할 수 있도록 해야 함 2022-12-10 17:36:07 | kkn

const zmq = require("zeromq");
const { dev } = require("../backend/utils/tools");
const Query = require("./src/models/Query");
const queryService = require("./src/services/query.service");
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const nebula = new Query();

async function runServer() {
  const sock = new zmq.Reply();

  await sock.bind("tcp://*:5555");

  for await (const [msg] of sock) {
    try {
      const decoded = decoder.decode(msg);
      dev.alias("Decoded").log(decoded);
      const json = JSON.parse(decoded);

      dev.preffix = "Server Received";
      dev.alias("User Json").log(json);

      dataProcessor(sock, json);
    } catch (e) {
      console.log(e);
      dev.log("error");
    }
    // Do some 'work'
  }
}

async function returnData(sock, data) {
  await sock.send(encoder.encode(JSON.stringify(data)));
}

// main process
async function dataProcessor(sock, data) {
  const resultData = {};
  Object.assign(resultData, data);
  // 2022-12-12 01:18:49
  // 0개 일 때 생성하는 로직
  // 유저 생성
  // 연결 가능한 채널 탐색
  // 있으면
  // 연결 가능한 채널에 유저 연결
  // 없으면
  // 채널 생성하고 유저 연결 및 공간에 채널 연결
  // 유저의 로케일에 맞춰서 소켓 생성(2) 및 연결(3), 로케일과 소켓 연결 (1)
  // 해당 소켓에 유저 연결

  if (data.type === "attach") {
    // 초기화부
    await queryService.initialize(data);
    // 생성부
    const datas = await queryService.createVertex(data);
    Object.assign(resultData, datas);
    await returnData(sock, resultData);
  } else if (data.type === "login") {
    const datas = await queryService.changeUserTypeToPlayer(data);
    Object.assign(resultData, datas);
    await returnData(sock, resultData);
  } else if (data.type === "logout") {
    const datas = await queryService.logoutUser(data);
    Object.assign(resultData, datas);
    await returnData(sock, resultData);
  }

  // await returnData(sock, data);
}

/* index 번호 체크용 */
// setInterval(() => {
//   dev.alias("next user index").log(index);
//   dev.alias("next space index").log(spaceIndex);
//   dev.alias("next channel index").log(channelIndex);
// }, 3000);

runServer();
