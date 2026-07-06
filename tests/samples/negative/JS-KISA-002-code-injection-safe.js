const actions = {
  ping: () => "pong",
  status: () => "ok"
};

function runAction(req) {
  const action = actions[req.query.action];
  return action ? action() : "unknown";
}
