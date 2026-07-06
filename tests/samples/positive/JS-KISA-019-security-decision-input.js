function updateRole(req) {
  if (req.body.isAdmin === true) {
    grantAdminRole(req.body.userId);
  }
}
