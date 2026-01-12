import joi from "joi";

export const categoryHeadersSchema = joi
  .object({
    authorization: joi.string().min(36).required(),
  })
  .unknown(true);

export const categoryBodySchema = joi.object({
  name: joi.string().min(2).max(50).required(),
  type: joi.string().allow("income", "expense").only().required(),
  icon: joi.string().min(1).max(100).required(),
  description: joi.string().max(100).allow("").optional(),
});

export const categoryParamsSchema = joi.object({
  id: joi.string().hex().length(24).required(),
});
