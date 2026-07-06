const trustedOrigin = "https://app.example.com";

function sendToken(token) {
  window.parent.postMessage(token, trustedOrigin);
}
