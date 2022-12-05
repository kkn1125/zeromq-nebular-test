const zmq = require("zeromq");
const { dev } = require("../utils/tools");

class ProxyRequest {
  #sock = new zmq.Request();

  constructor() {
    console.log("Connecting to hello world server…");
    //  Socket to talk to server
    this.#sock.connect("tcp://localhost:5555");
  }

  async send(data) {
    dev.log('Send Data:', data)
    await this.#sock.send(data);
    const decoder = new TextDecoder();
    const [result] = await this.#sock.receive();
    const content = decoder.decode(result);
    dev.log("Received ", content.toString());
    return JSON.parse(content);
  }
}

module.exports = ProxyRequest;
