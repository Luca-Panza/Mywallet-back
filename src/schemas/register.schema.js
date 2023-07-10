import joi from "joi";

export const registerSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().trim().required(),
  password: joi.string().min(3).required(),
});
