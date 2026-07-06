async function chargeCard() {
  try {
    await payment.charge();
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
