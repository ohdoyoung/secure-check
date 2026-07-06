const fs = require("fs");
const path = require("path");

function download(req) {
  return fs.readFile(path.join(DATA_DIR, req.query.file), "utf8");
}
