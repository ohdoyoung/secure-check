const crypto = require("crypto");

function hashPassword(req) {
  return crypto.createHash("sha256").update(req.body.password).digest("hex");
}
