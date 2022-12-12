const User = require("../models/User");
const { dev } = require("../utils/tools");
const axios = require("axios");
const ProxyRequest = require("../models/proxyRequest");
const broker = new ProxyRequest();
const encoder = new TextEncoder();
/* json메서드 사용시 데이터 필드가 undefined면 제외하고 json 객체를 response 한다. */
// const responses = new Map();
// const methods = new Map();
let index = 0;
// let method = null;

User.attach = async (req, res) => {
  const data = req.body;
  dev.preffix = "attach start";
  dev.log(data);
  try {
    await broker
      .send(JSON.stringify(data))
      .then((contents) => {
        dev.alias("Broker Receive").log(contents);
        res.status(200).json({
          ok: true,
          contents,
        });
      })
      .catch((e) => {
        dev.preffix = "ERROR";
        dev.log(e.code);
        broker.retry();
      });
  } catch (e) {
    broker.retry();
    console.log(e);
  }
};

User.logout = async (req, res) => {
  const data = req.body;

  try {
    const content = await broker
      .send(JSON.stringify(data))
      .then((result) => {
        dev.preffix = "broker receive";
        dev.log(result);
      })
      .catch((e) => {
        dev.preffix = "ERROR";
        dev.log(e.code);
        broker.retry();
      });
    res.status(200).json({
      ok: true,
      content,
    });
  } catch (e) {
    broker.retry();
    console.log(e);
  }
};

module.exports = User;
