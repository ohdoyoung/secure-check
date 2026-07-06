function sendPassword(password) {
  return fetch(`https://api.example.com/login?password=${password}`);
}
