const fs = require("fs");
const path = require("path");

function download(req) {
  const requested = path.basename(req.query.file);
  const resolved = path.resolve(BASE_DIR, requested);
  if (!resolved.startsWith(BASE_DIR)) {
    throw new Error("invalid path");
  }
  return fs.readFile(resolved, "utf8");
}
