const path = require("path");
const dotenv = require("dotenv");
const { dev } = require("../backend/utils/tools");

const MODE = process.env.NODE_ENV;

dotenv.config({
  path: path.join(__dirname, `.env`),
});

dotenv.config({
  path: path.join(__dirname, `.env.${MODE}`),
});

// console.log(process.env.SERVERS);
// console.log(process.env.USERNAME);
// console.log(process.env.PASSWORD);
// console.log(process.env.SPACE);
dev.log(`POOL ${process.env.POOLSIZE}개 생성`);
// console.log(process.env.BUFFERSIZE);
// console.log(process.env.EXECUTETIMEOUT);
// console.log(process.env.PINGINTERVAL);

const config = {
  servers: [].concat(process.env.SERVERS),
  userName: process.env.USERNAME,
  password: process.env.PASSWORD || "",
  space: process.env.SPACE,
  poolSize: Number(process.env.POOLSIZE),
  bufferSize: Number(process.env.BUFFERSIZE),
  executeTimeout: Number(process.env.EXECUTETIMEOUT),
  pingInterval: Number(process.env.PINGINTERVAL),
};

module.exports = config;
