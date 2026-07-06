function errorHandler(error, req, res, next) {
  logger.error(error);
  res.status(500).json({ message: "Internal Server Error" });
}
