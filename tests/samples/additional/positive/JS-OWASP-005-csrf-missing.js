app.post("/transfer", (req, res) => {
  transferMoney(req.body);
  res.json({ ok: true });
});
