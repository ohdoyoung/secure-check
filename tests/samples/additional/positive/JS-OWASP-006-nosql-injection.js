async function findUsers(req) {
  return User.find(req.query);
}
