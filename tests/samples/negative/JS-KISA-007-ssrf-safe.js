const axios = require("axios");

const allowedHosts = new Set(["api.example.com"]);

async function proxy(req) {
  const target = new URL(req.query.url);
  if (!allowedHosts.has(target.hostname)) {
    throw new Error("blocked host");
  }
  return axios.get(target.toString());
}
