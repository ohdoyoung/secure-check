app.post("/admin/delete-user", (req, res) => {
  deleteUser(req.body.id);
  res.json({ ok: true });
});
