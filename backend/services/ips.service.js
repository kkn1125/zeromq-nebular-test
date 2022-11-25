const Ips = require("../models/ips");

/* json메서드 사용시 데이터 필드가 undefined면 제외하고 json 객체를 response 한다. */

Ips.findAll = (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      nebula: req.body.nebula,
    });
  } catch (e) {}
};

Ips.findOne = (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      nebula: req.body.nebula,
    });
  } catch (e) {}
};

Ips.create = (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      nebula: req.body.nebula,
    });
  } catch (e) {}
};

Ips.update = (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      nebula: req.body.nebula,
    });
  } catch (e) {}
};

Ips.delete = (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      nebula: req.body.nebula,
    });
  } catch (e) {}
};

module.exports = Ips;
