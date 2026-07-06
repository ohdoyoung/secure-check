const crypto = require("crypto");

crypto.generateKeyPairSync("rsa", {
  modulusLength: 1024
});
