import { v4 } from "uuid";
import axios from "axios";
import Storage from "./src/model/Storage";
import { dev } from "./src/utils/tools";
import Socket from "./src/model/Socket";

const storage = new Storage();

window.addEventListener("load", async (e) => {
  const result = await axios.post("http://localhost:3000/v1/api/enter", {
    type: "attach",
    uuid: storage.uuid,
    email: storage.email,
    locale: storage.locale,
  });

  const { data } = result;
  const { contents } = data;
  dev.log(contents);
  storage.pool_socket = {
    ip: contents.socketIp,
    port: contents.socketPort,
  };
  storage.pool_publisher = {
    ip: contents.socketIp,
    port: contents.socketPort,
  };

  connectSocket(storage.pool_socket);
});

function connectSocket(poolSocketInfo) {
  const socket = new Socket(poolSocketInfo);
  console.log("✨ check socket info", poolSocketInfo);
  console.log("✨ check socket info", socket);
  // socket.ws.send({
  //   type: "connect",
  //   message: "connected",
  // });
}

window.addEventListener("beforeunload", async (e) => {
  false &&
    axios.post("http://localhost:3000/v1/api/logout", {
      type: "logout",
      uuid: storage.uuid,
    });
});

window.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("login")) return;
  // document.querySelector("#result").innerHTML = "loading...";
  e.target.offsetParent.classList.add("hide");

  const data = await axios.post("http://localhost:3000/v1/api/login", {
    type: "login",
    uuid: storage.uuid,
  });
});

window.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("logout")) return;
  // document.querySelector("#result").innerHTML = "loading...";
  e.target.classList.add("hide");
  await axios.post("http://localhost:3000/v1/api/logout", {
    type: "logout",
    uuid: storage.uuid,
  });
});
