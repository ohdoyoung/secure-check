const dns = require("dns");

function allowByDns(host, done) {
  dns.lookup(host, address => {
    if (address.startsWith("10.")) {
      return done(false);
    }
    return done(true);
  });
}
