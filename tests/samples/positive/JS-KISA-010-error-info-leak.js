function errorHandler(error, req, res, next) {
  res.status(500).send(error.stack);
}
