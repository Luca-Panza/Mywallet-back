export function validateSchema2(schema) {
  return (req, res, next) => {
    const validation = schema.validate(
      { type: req.params.type, token: req.headers.token, description: req.body.description, amount: req.body.amount },
      { abortEarly: false }
    );

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    next();
  };
}
