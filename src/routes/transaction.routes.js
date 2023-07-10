import { Router } from "express";
import { postTransaction, getTransaction } from "../controllers/transactions.controller.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { transactionSchema } from "../schemas/transaction.schema.js";

const transactionRouter = Router();

transactionRouter.post("/new-transaction/:type", validateSchema(transactionSchema), postTransaction);
transactionRouter.get("/transactions", getTransaction);

export default transactionRouter;
