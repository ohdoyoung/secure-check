function setSessionCookie(req, res) {
  res.cookie("session", req.sessionID, {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  });
}
