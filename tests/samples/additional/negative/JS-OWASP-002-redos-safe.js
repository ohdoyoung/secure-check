const RE2 = require("re2");

function validateName(req) {
  const input = req.body.name;
  if (input.length > 128) {
    throw new Error("too long");
  }
  return new RE2("^a+$").test(input);
}
