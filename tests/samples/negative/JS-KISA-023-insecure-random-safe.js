const crypto = require("crypto");

function issueResetToken() {
  return crypto.randomBytes(32).toString("hex");
}
