const https = require("https");

https.request({
  host: "internal.example.com",
  ca: trustedCa,
  rejectUnauthorized: true
});
