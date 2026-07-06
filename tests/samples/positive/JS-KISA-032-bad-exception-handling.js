async function chargeCard() {
  try {
    await payment.charge();
  } catch (error) {
  }
}
