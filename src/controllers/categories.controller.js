import { stripHtml } from "string-strip-html";
import { db } from "../database/database.connection.js";
import { ObjectId } from "mongodb";

export async function createCategory(req, res) {
  const { authorization } = req.headers;
  const { name, type, icon } = req.body;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  const cleanCategory = {
    token: stripHtml(token).result.trim(),
    name: stripHtml(name).result.trim(),
    type: type,
    icon: stripHtml(icon).result.trim(),
  };

  try {
    const user = await db.collection("sessions").findOne({ token: cleanCategory.token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const existingCategory = await db.collection("categories").findOne({
      userId: user.id,
      name: cleanCategory.name,
      type: cleanCategory.type
    });
    if (existingCategory) return res.status(409).send("Category with this name and type already exists!");

    const newCategory = await db.collection("categories").insertOne({
      userId: user.id,
      name: cleanCategory.name,
      type: cleanCategory.type,
      icon: cleanCategory.icon,
    });
    
    if (newCategory) res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

export async function getCategories(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const categories = await db.collection("categories").find({ userId: user.id }).toArray();
    return res.send(categories);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

export async function updateCategory(req, res) {
  const { authorization } = req.headers;
  const { id } = req.params;
  const { name, type, icon } = req.body;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  const cleanCategory = {
    token: stripHtml(token).result.trim(),
    name: stripHtml(name).result.trim(),
    type: type,
    icon: stripHtml(icon).result.trim(),
  };

  try {
    const user = await db.collection("sessions").findOne({ token: cleanCategory.token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const category = await db.collection("categories").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });
    if (!category) return res.status(404).send("Category not found!");

    const existingCategory = await db.collection("categories").findOne({
      userId: user.id,
      name: cleanCategory.name,
      type: cleanCategory.type,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingCategory) return res.status(409).send("Category with this name and type already exists!");

    const updatedCategory = await db.collection("categories").updateOne(
      { _id: new ObjectId(id), userId: user.id },
      {
        $set: {
          name: cleanCategory.name,
          type: cleanCategory.type,
          icon: cleanCategory.icon,
        }
      }
    );

    if (updatedCategory.matchedCount === 0) return res.status(404).send("Category not found!");
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

export async function deleteCategory(req, res) {
  const { authorization } = req.headers;
  const { id } = req.params;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const category = await db.collection("categories").findOne({
      _id: new ObjectId(id),
      userId: user.id
    });
    if (!category) return res.status(404).send("Category not found!");

    await db.collection("transactions").updateMany(
      { categoryId: id },
      { $unset: { categoryId: "" } }
    );

    const deletedCategory = await db.collection("categories").deleteOne({
      _id: new ObjectId(id),
      userId: user.id
    });

    if (deletedCategory.deletedCount === 0) return res.status(404).send("Category not found!");
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}
