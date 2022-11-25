const router = require("express");
const userRouter = router.Router();
const userService = require("../services/user.service");

userRouter.get("/users", (req, res) => {
  userService.middleware().findAll(req, res);
});

userRouter.get("/users/:id([0-9]+)", (req, res) => {
  userService.middleware().findOne(req, res);
});

userRouter.post("/users", (req, res) => {
  userService.middleware().create(req, res);
});

userRouter.put("/users/:id([0-9]+)", (req, res) => {
  userService.middleware().update(req, res);
});

userRouter.delete("/users/:id([0-9]+)", (req, res) => {
  userService.middleware().delete(req, res);
});

module.exports.userController = userRouter;
