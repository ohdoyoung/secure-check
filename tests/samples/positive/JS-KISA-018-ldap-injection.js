function findUser(req, ldapClient) {
  return ldapClient.search("ou=users", {
    filter: "(uid=" + req.query.uid + ")"
  });
}
