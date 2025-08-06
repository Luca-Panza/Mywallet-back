import { Router } from "express";
import authRouter from "./auth.routes.js";
import transactionRouter from "./transaction.routes.js";
import categoryRouter from "./categories.routes.js";

const indexRouter = Router();

indexRouter.use(authRouter);
indexRouter.use(transactionRouter);
indexRouter.use(categoryRouter);

export default indexRouter;
