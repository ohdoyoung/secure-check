function renderTemplate(req, res) {
  const compiled = handlebars.compile(req.body.template);
  res.send(compiled(req.body.data));
}
