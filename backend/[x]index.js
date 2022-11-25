const express = require("express");
const app = express();
const pm2 = require("pm2");

app.get("/", (req, res) => {
  console.log(123);
  res.status(200).send("test");
});

app.get("/create", async (req, res) => {
  create().then((result) => {
    console.log(result);
    res.status(200).send(result.length);
  });
});

async function create() {
  let temp;
  pm2.start(
    {
      script: "index.js",
      name: "api",
      exec_mode: "cluster",
    },
    function (err, apps) {
      if (err) {
        console.error(err);
        return pm2.disconnect();
      }

      pm2.list((err, list) => {
        console.log(err, list);
      });
    }
  );
  pm2.list((err, list) => {
    temp = list;
  });

  return await temp;
}

app.listen(3000, () => {
  console.log("listening on port 3000");
});
