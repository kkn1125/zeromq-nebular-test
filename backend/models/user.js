class User {
  #ws;
  #uuid;
  #isLive;
  #byteQueue;
  #jsonQueue;
  constructor({ ws, uuid, isLive, byteQueue, jsonQueue }) {
    this.#ws = ws;
    this.#uuid = uuid;
    this.#isLive = isLive;
    this.#byteQueue = byteQueue;
    this.#jsonQueue = jsonQueue;
  }
}

module.exports = User;
