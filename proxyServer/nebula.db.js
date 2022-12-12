const config = require("./nebula.conf");
const NEBULA = require("@nebula-contrib/nebula-nodejs");
const { dev } = require("../backend/utils/tools");

const queries = [
  /* Spaces */
  // `CREATE SPACE IF NOT EXISTS server (partition_num=15, replica_factor=1, vid_type=FIXED_STRING(50)) COMMENT="test server"`,

  /* Tags */
  `CREATE TAG IF NOT EXISTS locales (limit INT64)`,
  `CREATE TAG IF NOT EXISTS pool_sockets (url STRING, ip STRING, port INT64, is_live BOOL, cpu_usage FLOAT, memory_usage FLOAT)`,
  `CREATE TAG IF NOT EXISTS pool_publishers (url STRING, ip STRING, port INT64, is_live BOOL)`,
  `CREATE TAG IF NOT EXISTS spaces (volume FLOAT, owner STRING, limit INT64)`,
  `CREATE TAG IF NOT EXISTS channels (limit INT64)`,
  `CREATE TAG IF NOT EXISTS users (email STRING)`,

  /* Edges */
  `CREATE EDGE IF NOT EXISTS include (sequence INT64)`,
  `CREATE EDGE IF NOT EXISTS socket (port INT64, is_connect BOOL)`,
  `CREATE EDGE IF NOT EXISTS pub (port INT64, is_connect BOOL)`,
  `CREATE EDGE IF NOT EXISTS allocation (type STRING, status BOOL)`,
  `CREATE EDGE IF NOT EXISTS attach (sequence INT64, type STRING, activate BOOL)`,
  `CREATE EDGE IF NOT EXISTS sync (is_sync BOOL)`,

  /* Indexes */
  `CREATE TAG INDEX IF NOT EXISTS locales_index ON locales()`,
  `CREATE TAG INDEX IF NOT EXISTS pool_sockets_index ON pool_sockets()`,
  `CREATE TAG INDEX IF NOT EXISTS pool_publishers_index ON pool_publishers()`,
  `CREATE TAG INDEX IF NOT EXISTS spaces_index ON spaces()`,
  `CREATE TAG INDEX IF NOT EXISTS channels_index ON channels()`,
  `CREATE TAG INDEX IF NOT EXISTS users_index ON users()`,
  `CREATE EDGE INDEX IF NOT EXISTS include_index ON include()`,
  `CREATE EDGE INDEX IF NOT EXISTS socket_index ON socket()`,
  `CREATE EDGE INDEX IF NOT EXISTS pub_index ON pub()`,
  `CREATE EDGE INDEX IF NOT EXISTS allocation_index ON allocation()`,
  `CREATE EDGE INDEX IF NOT EXISTS attach_index ON attach()`,
  `CREATE EDGE INDEX IF NOT EXISTS sync_index ON sync()`,
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
