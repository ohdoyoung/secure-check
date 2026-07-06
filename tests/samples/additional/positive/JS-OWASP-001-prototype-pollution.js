const merge = require("lodash.merge");

function updateProfile(req) {
  const target = {};
  merge(target, req.body);
  return target;
}
