import { Router } from "express";
import { postTransaction, getTransaction } from "../controllers/transactions.controller.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { transactionHeadersSchema, transactionParamsSchema, transactionBodySchema } from "../schemas/transaction.schema.js";

const transactionRouter = Router();

transactionRouter.post(
  "/new-transaction/:type",
  validateSchema(transactionHeadersSchema, "headers"),
  validateSchema(transactionParamsSchema, "params"),
  validateSchema(transactionBodySchema, "body"),
  postTransaction
);
transactionRouter.get("/transactions", getTransaction);

export default transactionRouter;
