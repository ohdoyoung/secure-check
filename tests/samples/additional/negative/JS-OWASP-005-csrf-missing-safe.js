app.post("/transfer", requireAuth, csrf(), (req, res) => {
  transferMoney(req.body);
  res.json({ ok: true });
});
