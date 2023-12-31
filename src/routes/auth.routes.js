import { Router } from "express";
import { signUp, signIn } from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { registerSchema } from "../schemas/register.schema.js";
import { loginSchema } from "../schemas/login.schema.js";

const authRouter = Router();

authRouter.post("/signUp", validateSchema(registerSchema, "body"), signUp);
authRouter.post("/signIn", validateSchema(loginSchema, "body"), signIn);

export default authRouter;
