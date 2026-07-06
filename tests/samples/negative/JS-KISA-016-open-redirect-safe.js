const allowedRedirects = new Set(["/dashboard", "/settings"]);

function redirectAfterLogin(req, res) {
  const target = validateRedirectUrl(req.query.next, allowedRedirects);
  res.redirect(target);
}
