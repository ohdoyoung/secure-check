const crypto = require("crypto");

function checksum(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
