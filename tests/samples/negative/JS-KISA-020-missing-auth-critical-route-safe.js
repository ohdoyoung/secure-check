app.post("/admin/delete-user", requireAuth, requireRole("admin"), csrfProtection, (req, res) => {
  deleteUser(req.body.id);
  res.json({ ok: true });
});
