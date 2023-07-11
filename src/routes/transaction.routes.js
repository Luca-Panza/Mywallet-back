import { Router } from "express";
import { postTransaction, getTransaction } from "../controllers/transactions.controller.js";
import { validateSchema2 } from "../middlewares/validateSchema2.js";
import { transactionSchema } from "../schemas/transaction.schema.js";

const transactionRouter = Router();

transactionRouter.post("/new-transaction/:type", validateSchema2(transactionSchema), postTransaction);
transactionRouter.get("/transactions", getTransaction);

export default transactionRouter;
