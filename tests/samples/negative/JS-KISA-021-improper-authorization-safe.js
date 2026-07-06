async function getInvoice(req, res) {
  const invoice = await Invoice.findOne({ _id: req.params.id, ownerId: req.user.id });
  res.json(invoice);
}
