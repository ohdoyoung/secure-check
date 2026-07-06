fs.readFile("/etc/app.conf", (err, data) => {
  if (err) {
    logger.error(err);
    return next(err);
  }
  parseConfig(data);
});
