const { exec } = require("child_process");

function list(req) {
  exec("ls " + req.query.dir);
}
