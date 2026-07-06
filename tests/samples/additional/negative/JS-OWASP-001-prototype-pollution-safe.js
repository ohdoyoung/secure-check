function updateProfile(req) {
  const blockedKeys = new Set(["__proto__", "prototype", "constructor"]);
  const target = Object.create(null);
  for (const key of Object.keys(req.body)) {
    if (!blockedKeys.has(key)) {
      target[key] = req.body[key];
    }
  }
  return target;
}
