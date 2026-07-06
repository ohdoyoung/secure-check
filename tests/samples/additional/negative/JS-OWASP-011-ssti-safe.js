const templateMap = {
  receipt: "receipt",
  profile: "profile"
};

function renderTemplate(req, res) {
  const view = templateMap[req.body.template] || "profile";
  res.render(view, { user: req.user });
}
