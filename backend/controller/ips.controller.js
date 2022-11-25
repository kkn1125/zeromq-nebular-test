const router = require("express");
const ipsRouter = router.Router();
const ipsService = require("../services/ips.service");

ipsRouter.get("/ips", (req, res) => {
  ipsService.findAll(req, res);
});

ipsRouter.get("/ips/:id([0-9]+)", (req, res) => {
  ipsService.findOne(req, res);
});

ipsRouter.post("/ips", (req, res) => {
  ipsService.create(req, res);
});

ipsRouter.put("/ips/:id([0-9]+)", (req, res) => {
  ipsService.update(req, res);
});

ipsRouter.delete("/ips/:id([0-9]+)", (req, res) => {
  ipsService.delete(req, res);
});

module.exports.ipsController = ipsRouter;
