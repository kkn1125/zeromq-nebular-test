const router = require("express");
const userRouter = router.Router();
const userService = require("../services/user.service");

/* 서버 모델에 필요한 경로 */

userRouter.post("/enter", (req, res) => {
  console.log("enter api");
  userService.attach(req, res);
});

userRouter.post("/login", (req, res) => {
  console.log("login api");
  userService.attach(req, res);
});

userRouter.post("/logout", (req, res) => {
  console.log("login api");
  userService.logout(req, res);
});

/* 기본 CRUD */
// userRouter.get("/users", (req, res) => {
//   userService.findAll(req, res);
// });

// userRouter.get("/users/:id([0-9]+)", (req, res) => {
//   userService.findOne(req, res);
// });

// userRouter.post("/users", (req, res) => {
//   userService.create(req, res);
// });

// userRouter.put("/users/:id([0-9]+)", (req, res) => {
//   userService.update(req, res);
// });

// userRouter.delete("/users/:id([0-9]+)", (req, res) => {
//   userService.delete(req, res);
// });

module.exports.userController = userRouter;
