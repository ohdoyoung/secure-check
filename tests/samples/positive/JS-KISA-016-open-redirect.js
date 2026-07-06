function redirectAfterLogin(req, res) {
  res.redirect(req.query.next);
}
