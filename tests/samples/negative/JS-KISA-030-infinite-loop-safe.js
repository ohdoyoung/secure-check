function waitWithLimit(maxRetries) {
  let retry = 0;
  while (retry < maxRetries) {
    retry += 1;
    if (pollQueue()) break;
  }
}
