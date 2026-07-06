function restore(req) {
  const payload = JSON.parse(req.body.payload);
  return schema.safeParse(payload);
}
