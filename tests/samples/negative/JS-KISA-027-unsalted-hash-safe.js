const bcrypt = require("bcrypt");

async function hashPassword(req) {
  return bcrypt.hash(req.body.password, 12);
}
