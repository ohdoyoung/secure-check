function updateProfile(req, user) {
  const safeFields = pick(req.body, ["displayName", "bio"]);
  Object.assign(user, safeFields);
  return user.save();
}
