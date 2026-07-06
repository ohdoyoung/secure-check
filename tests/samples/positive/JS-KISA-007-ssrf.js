const axios = require("axios");

async function proxy(req) {
  const url = req.query.url;
  return axios.get(url);
}
