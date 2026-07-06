function parseToken(req) {
  const token = req.headers.authorization;
  return jwt.decode(token);
}
