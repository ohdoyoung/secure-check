function findUser(req, ldapClient) {
  const uid = escapeLDAP(req.query.uid);
  return ldapClient.search("ou=users", {
    filter: "(uid=" + uid + ")"
  });
}
