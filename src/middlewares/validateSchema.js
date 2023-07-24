export function validateSchema(schema, field) {
  return (req, res, next) => {
    const validation = schema.validate(req[field], { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    next();
  };
}
