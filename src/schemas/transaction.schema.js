import joi from "joi";

export const transactionHeadersSchema = joi
  .object({
    authorization: joi.string().min(36).max(36).required(),
  })
  .unknown(true);

export const transactionParamsSchema = joi.object({
  type: joi.string().allow("income", "expense").only().required(),
});

export const transactionBodySchema = joi.object({
  description: joi.string().min(4).required(),
  amount: joi.number().min(0.01).required(),
});
