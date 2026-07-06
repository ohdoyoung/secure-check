function updateProfile(req, user) {
  Object.assign(user, req.body);
  return user.save();
}
