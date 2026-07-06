function sendToken(token) {
  window.parent.postMessage(token, "*");
}
