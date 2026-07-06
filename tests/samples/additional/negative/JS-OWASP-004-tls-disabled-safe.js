const https = require("https");

https.request({
  host: "api.example.com",
  ca: trustedCa,
  rejectUnauthorized: true
});
