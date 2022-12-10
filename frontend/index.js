import { v4 } from "uuid";
import axios from "axios";
import Storage from "./src/model/Storage";

const storage = new Storage();

window.addEventListener("load", async (e) => {
  const result = await axios.post("http://localhost:3000/v1/api/enter", {
    type: "attach",
    uuid: storage.uuid,
    email: storage.email,
    locale: storage.locale,
  });

  const { data } = result;
  dev.log(data);
});

window.addEventListener("beforeunload", async (e) => {
  false &&
    axios.post("http://localhost:3000/v1/api/logout", {
      type: "logout",
      uuid: storage.uuid,
    });
});

document.querySelector("#findall").addEventListener("click", () => {
  document.querySelector("#result").innerHTML = "loading...";
  axios
    .get("http://localhost:3000/v1/api/users", {
      params: { uuid: storage.uuid },
    })
    .then((result) => {
      const { data } = result;
      document.querySelector("#result").innerHTML =
        `<h3>result</h3><hr />` +
        Object.entries(data)
          .map(([k, v]) => `${k.padEnd(10, " ")} => ${v}`)
          .join("<br />");
    });
});

document.querySelector("#findone").addEventListener("click", () => {
  document.querySelector("#result").innerHTML = "loading...";
  axios
    .get("http://localhost:3000/v1/api/users/1", {
      params: { uuid: storage.uuid },
    })
    .then((result) => {
      const { data } = result;
      document.querySelector("#result").innerHTML =
        `<h3>result</h3><hr />` +
        Object.entries(data)
          .map(([k, v]) => `${k.padEnd(10, " ")} => ${v}`)
          .join("<br />");
    });
});
