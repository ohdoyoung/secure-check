app.post("/login", (req, res) => {
  authenticate(req.body.email, req.body.password);
  res.json({ ok: true });
});
