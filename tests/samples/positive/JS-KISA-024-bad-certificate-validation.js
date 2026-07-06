const https = require("https");

https.request({
  host: "internal.example.com",
  rejectUnauthorized: false
});
