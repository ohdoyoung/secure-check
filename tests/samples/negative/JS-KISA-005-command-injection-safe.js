const { execFile } = require("child_process");

function list() {
  execFile("/bin/ls", ["-la", "/srv/app/uploads"]);
}
