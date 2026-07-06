function sendPassword(password) {
  return fetch("https://api.example.com/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}
