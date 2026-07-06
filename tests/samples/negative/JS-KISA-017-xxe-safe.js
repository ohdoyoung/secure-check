function parseUploadedXml(req) {
  return libxmljs.parseXml(req.body.xml, { noent: false, nonet: true });
}
