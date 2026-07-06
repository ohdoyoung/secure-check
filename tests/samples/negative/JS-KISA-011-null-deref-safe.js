function email(req) {
  const account = req.body.account;
  return account?.profile?.email ?? null;
}
