const router = require("express");
const userRouter = router.Router();
const userService = require("../services/user.service");

userRouter.get("/users", (req, res) => {
  userService.findAll(req, res);
});

userRouter.get("/users/:id([0-9]+)", (req, res) => {
  userService.findOne(req, res);
});

userRouter.post("/users", (req, res) => {
  userService.create(req, res);
});

userRouter.put("/users/:id([0-9]+)", (req, res) => {
  userService.update(req, res);
});

userRouter.delete("/users/:id([0-9]+)", (req, res) => {
  userService.delete(req, res);
});

module.exports.userController = userRouter;
