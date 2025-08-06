import { Router } from "express";
import { postTransaction, getTransaction, getTransactionsSummary, deleteTransaction, updateTransaction, getTransactionById } from "../controllers/transactions.controller.js";
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
transactionRouter.get(
  "/transactions/summary",
  validateSchema(transactionHeadersSchema, "headers"),
  getTransactionsSummary
);
transactionRouter.get(
  "/transaction/:id",
  validateSchema(transactionHeadersSchema, "headers"),
  getTransactionById
);
transactionRouter.put(
  "/transaction/:id",
  validateSchema(transactionHeadersSchema, "headers"),
  updateTransaction
);
transactionRouter.delete(
  "/transaction/:id",
  validateSchema(transactionHeadersSchema, "headers"),
  deleteTransaction
);

export default transactionRouter;
