/* 환경변수 설정 */
const path = require("path");
const dotenv = require("dotenv");
const mode = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.join(__dirname, `.env.${mode}`),
});

/* express 관련 모듈 */
const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const { userController } = require("./controller/user.controller");
const { ipsController } = require("./controller/ips.controller");
const { dev } = require("./utils/tools");
const formDataMiddleWare = multer();

/* 전역 변수 */
const host = process.env.HOST;
const port = process.env.PORT;

app.use(formDataMiddleWare.any());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/v1/api/users", (req, res, next) => {
  dev.log("custom middleware");
  next();
});

app.use("/v1/api", userController);
app.use("/v1/api", ipsController);

app.listen(port, () => {
  console.log("app listening on port " + port, `host is ${host}`);
});
