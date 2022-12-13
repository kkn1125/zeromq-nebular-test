class Socket {
  /**
   * @type {WebSocket}
   */
  #isDone = false;
  #ws = null;
  constructor(socketInfo) {
    try {
      const { ip, port } = socketInfo;
      const ws = new WebSocket(`ws://${ip}:${port}`);
      ws.binaryType = "arraybuffer";

      ws.onopen = function () {
        this.#isDone = true;
      }.bind(this);
      ws.onmessage = function () {};
      ws.onerror = function () {};
      ws.onclose = function () {};
      this.#ws = ws;
    } catch (e) {}
    this.#loadingProcess();
  }

  #loadingProcess() {
    const loading = document.createElement("div");
    const loadingText = document.createElement("span");
    loading.id = "loading";
    loading.style.cssText = `text-align: center;`;
    loadingText.style.cssText = `
      position: fixed;
      font-size: 3rem;
      text-align: left;
      width: 10rem;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    loading.appendChild(loadingText);
    let loadingProcessFlag = 0;
    document.body.append(loading);

    function loadingProcessPercent(time) {
      time *= 0.005;
      const index = parseInt(time);
      loadingText.textContent = "Loading" + ".".repeat((index % 3) + 1);
      // loading.style.paddingLeft = ((index % 3) + 1) * 0.655 + "rem";
      if (this.#isDone) {
        cancelAnimationFrame(loadingProcessFlag);
        loading.remove();
      } else {
        requestAnimationFrame(loadingProcessPercent.bind(this));
      }
    }

    loadingProcessFlag = requestAnimationFrame(
      loadingProcessPercent.bind(this)
    );
  }

  /**
   * @type {WebSocket} ws - web socket
   */
  get ws() {
    return this.#ws;
  }
}

export default Socket;
