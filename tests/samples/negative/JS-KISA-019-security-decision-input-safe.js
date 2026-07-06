function updateRole(req) {
  if (req.user.role === "admin") {
    grantAdminRole(req.body.userId);
  }
}
