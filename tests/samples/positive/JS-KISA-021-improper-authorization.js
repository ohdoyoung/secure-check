async function getInvoice(req, res) {
  const invoice = await Invoice.findById(req.params.id);
  res.json(invoice);
}
