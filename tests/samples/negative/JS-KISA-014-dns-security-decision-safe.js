const allowedHosts = new Set(["api.example.com"]);

function allowByHost(host) {
  return allowedHosts.has(host);
}
