const fs = require("fs");
const https = require("https");

https.get("https://cdn.example.com/plugin.js", (response) => {
  response.pipe(fs.createWriteStream("plugin.js"));
});
