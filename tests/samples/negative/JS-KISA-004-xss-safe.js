function profile(req, res) {
  const name = escapeHtml(req.query.name);
  res.send("<h1>Hello " + name + "</h1>");
}
