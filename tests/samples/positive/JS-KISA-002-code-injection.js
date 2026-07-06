function runExpression(req) {
  const userExpression = req.query.expression;
  return eval(userExpression);
}
