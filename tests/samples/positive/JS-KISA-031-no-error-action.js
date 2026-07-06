fs.readFile("/etc/app.conf", (err, data) => {
  if (err) return;
  parseConfig(data);
});
