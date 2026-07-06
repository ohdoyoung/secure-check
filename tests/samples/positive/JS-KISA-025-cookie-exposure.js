function setSessionCookie(req, res) {
  res.cookie("session", req.sessionID, { httpOnly: false, secure: false });
}
