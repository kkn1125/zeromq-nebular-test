const config = require("./nebula.conf");
const NEBULA = require("@nebula-contrib/nebula-nodejs");
const { dev } = require("../backend/utils/tools");

class Client {
  #client;
  constructor() {
    dev.log("네뷸러 테스트 시작");
    this.#client = NEBULA.createClient(config);
    this.initialize();
    this.initialSpace();
    return this.#client;
  }

  initialSpace() {
    this.#client
      .execute(
        `
      CREATE SPACE IF NOT EXISTS server (
        partition_num = 15,
        replica_factor = 1,
        vid_type = FIXED_STRING(50)
      )
      `
      )
      .then((result) => {
        console.log("완료");
      });
  }

  initialize() {
    this.#client.on("ready", ({ sender }) => {
      dev.log("ready");
      // dev.log(sender);
    });

    // error occurs
    this.#client.on("error", ({ sender, error }) => {
      dev.log("error");
      // dev.log(sender);
      dev.log(error);
    });

    // connected event
    this.#client.on("connected", ({ sender }) => {
      dev.log("connected");
      // dev.log(sender);
    });

    // authorized successfully
    this.#client.on("authorized", ({ sender }) => {
      dev.log("authorized");
      // dev.log(sender);
    });

    // reconnecting
    this.#client.on("reconnecting", ({ sender, retryInfo }) => {
      dev.log("reconnecting");
      // dev.log(sender);
      // dev.log(retryInfo);
    });

    // closed
    this.#client.on("close", ({ sender }) => {
      dev.log("close");
      // dev.log(sender);
      // client.execute("show sessions").then((result) => {
      //   console.log(result);
      //   const { data } = result;
      //   const { SessionId } = data;
      //   // client.execute(`KILL QUERY (session=${},`)
      // });
    });
  }
}

module.exports = Client;

// connection is ready for executing command

// process.on("SIGINT", () => {
//   dev.log("sigint");
//   client.close();
//   process.exit();
// });
