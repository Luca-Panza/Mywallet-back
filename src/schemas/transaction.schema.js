import joi from "joi";

export const transactionSchema = joi.object({
  type: joi.string().allow("entrada", "saida").only().required(),
  token: joi.string().min(36).max(36).required(),
  description: joi.string().min(4).required(),
  amount: joi.number().min(0.01).required(),
});
