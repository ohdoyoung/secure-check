const serialize = require("node-serialize");

function restore(req) {
  const payload = req.body.payload;
  return serialize.unserialize(payload);
}
