const config = require("./nebula.conf");
const NEBULA = require("@nebula-contrib/nebula-nodejs");
const { dev } = require("../backend/utils/tools");

const queries = [
  /* Tags */
  `CREATE TAG IF NOT EXISTS pools (locale STRING)`,
  `CREATE TAG IF NOT EXISTS pool_socket (url STRING, port INT, live_status BOOL, cpu_usage float, mem_usage float)`,
  `CREATE TAG IF NOT EXISTS pool_publish (url STRING, port INT, live_status BOOL)`,
  `CREATE TAG IF NOT EXISTS space (name STRING, volume FLOAT, owner STRING, max_users INT, max_boservers INT, max_managers INT)`,
  `CREATE TAG IF NOT EXISTS channel (name STRING)`,
  `CREATE TAG IF NOT EXISTS user (uuid STRING, email STRING)`,
  /* Edges */
  `CREATE EDGE IF NOT EXISTS socket (port INT, connect_status BOOL)`,
  `CREATE EDGE IF NOT EXISTS child_pool (name STRING, sequence INT)`,
  `CREATE EDGE IF NOT EXISTS attach (sequence INT, type STRING)`,
  `CREATE EDGE IF NOT EXISTS allocation (type STRING)`,
];

class Client {
  #client;
  constructor() {
    dev.log("네뷸러 테스트 시작");
    this.#client = NEBULA.createClient(config);
    this.initialize();
    return this.#client;
  }

  async initialSpace() {
    /* 초기화 쿼리 실행 */
    for (let query of queries) {
      await this.#client.execute(query);
    }
  }

  initialize() {
    this.#client.on("ready", ({ sender }) => {
      dev.log("ready");
      this.initialSpace();
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

module.exports = new Client();

// connection is ready for executing command

// process.on("SIGINT", () => {
//   dev.log("sigint");
//   client.close();
//   process.exit();
// });
