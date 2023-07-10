import { Router } from "express";
import authRouter from "./auth.routes.js";
import transactionRouter from "./transaction.routes.js";

const indexRouter = Router();

indexRouter.use(authRouter);
indexRouter.use(transactionRouter);

export default indexRouter;
