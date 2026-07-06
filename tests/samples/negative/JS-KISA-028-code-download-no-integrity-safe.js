const fs = require("fs");
const https = require("https");

https.get("https://cdn.example.com/plugin.js", (response) => {
  verifySignature(response.headers.signature);
  response.pipe(fs.createWriteStream("plugin.js"));
});
