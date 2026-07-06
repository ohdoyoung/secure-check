function parseToken(req) {
  const token = req.headers.authorization;
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: "https://issuer.example.com"
  });
}
