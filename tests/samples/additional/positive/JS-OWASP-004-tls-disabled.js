const https = require("https");

https.request({
  host: "api.example.com",
  rejectUnauthorized: false
});
