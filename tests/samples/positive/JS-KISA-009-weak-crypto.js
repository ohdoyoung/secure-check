const crypto = require("crypto");

function checksum(value) {
  return crypto.createHash("md5").update(value).digest("hex");
}
