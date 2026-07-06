async function findUsers(req) {
  const filter = mongoSanitize({ email: req.query.email });
  return User.find({ email: { $eq: filter.email } });
}
