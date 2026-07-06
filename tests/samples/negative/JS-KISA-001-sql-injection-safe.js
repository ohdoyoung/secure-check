async function findUser(req, pool) {
  const email = req.query.email;
  return pool.query("SELECT * FROM users WHERE email = ?", [email]);
}
