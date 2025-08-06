import { Router } from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categories.controller.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { categoryHeadersSchema, categoryBodySchema, categoryParamsSchema } from "../schemas/category.schema.js";

const categoryRouter = Router();

categoryRouter.post(
  "/categories",
  validateSchema(categoryHeadersSchema, "headers"),
  validateSchema(categoryBodySchema, "body"),
  createCategory
);

categoryRouter.get(
  "/categories",
  validateSchema(categoryHeadersSchema, "headers"),
  getCategories
);

categoryRouter.put(
  "/categories/:id",
  validateSchema(categoryHeadersSchema, "headers"),
  validateSchema(categoryParamsSchema, "params"),
  validateSchema(categoryBodySchema, "body"),
  updateCategory
);

categoryRouter.delete(
  "/categories/:id",
  validateSchema(categoryHeadersSchema, "headers"),
  validateSchema(categoryParamsSchema, "params"),
  deleteCategory
);

export default categoryRouter;
