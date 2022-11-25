import { v4 } from "uuid";
import axios from "axios";

const uuid = v4();

document.querySelector("#findall").addEventListener("click", () => {
  axios
    .get("http://localhost:3000/v1/api/users", { params: { uuid: uuid } })
    .then((result) => {
      const { data } = result;
      document.querySelector("#result").innerHTML =
        `<h3>result</h3><hr />` +
        Object.entries(data)
          .map(([k, v]) => `${k} => ${v}`)
          .join("<br />");
    });
});

document.querySelector("#findone").addEventListener("click", () => {
  axios
    .get("http://localhost:3000/v1/api/users/1", {
      params: { uuid: uuid, query: "nebula query" },
    })
    .then((result) => {
      const { data } = result;
      document.querySelector("#result").innerHTML =
        `<h3>result</h3><hr />` +
        Object.entries(data)
          .map(([k, v]) => `${k} => ${v}`)
          .join("<br />");
    });
});
