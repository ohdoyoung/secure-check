function checkout(cart) {
  auditLogger.info("checkout requested");
  return cart.total;
}
