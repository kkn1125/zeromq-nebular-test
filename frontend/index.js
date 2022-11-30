import { v4 } from "uuid";
import axios from "axios";

document.querySelector("#findall").addEventListener("click", () => {
  const uuid = v4();
  document.querySelector("#result").innerHTML = "loading...";
  axios
    .get("http://localhost:3000/v1/api/users", {
      params: { uuid: uuid, query: "nebula query" },
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
  const uuid = v4();
  document.querySelector("#result").innerHTML = "loading...";
  axios
    .get("http://localhost:3000/v1/api/users/1", {
      params: { uuid: uuid, query: "nebula query" },
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
