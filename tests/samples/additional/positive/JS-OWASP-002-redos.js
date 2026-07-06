function validateName(req) {
  return /(a+)+$/.test(req.body.name);
}
