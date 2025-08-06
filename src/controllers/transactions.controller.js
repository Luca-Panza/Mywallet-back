import { stripHtml } from "string-strip-html";
import dayjs from "dayjs";
import { db } from "../database/database.connection.js";
import { ObjectId } from "mongodb";

export async function postTransaction(req, res) {
  const { authorization } = req.headers;
  const { description, amount, categoryId } = req.body;
  const { type } = req.params;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  const cleanTransaction = {
    type: type,
    token: stripHtml(token).result.trim(),
    description: stripHtml(description).result.trim(),
    amount: amount,
    categoryId: categoryId,
  };

  try {
    const user = await db.collection("sessions").findOne({ token: cleanTransaction.token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    if (cleanTransaction.categoryId) {
      const category = await db.collection("categories").findOne({
        _id: new ObjectId(cleanTransaction.categoryId),
        userId: user.id
      });
      if (!category) return res.status(400).send("Invalid category!");

      if (category.type !== cleanTransaction.type) {
        return res.status(400).send("Category type does not match transaction type!");
      }
    }

    const transactionData = {
      id: user.id,
      type: cleanTransaction.type,
      description: cleanTransaction.description,
      date: dayjs().toDate(),
      amount: parseFloat(amount.toFixed(2)),
    };

    if (cleanTransaction.categoryId) {
      transactionData.categoryId = cleanTransaction.categoryId;
    }

    const newTransaction = await db.collection("transactions").insertOne(transactionData);
    if (newTransaction) res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

export async function getTransaction(req, res) {
  const { authorization } = req.headers;

  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const transactions = await db.collection("transactions")
      .aggregate([
        { $match: { id: user.id } },
        {
          $lookup: {
            from: "categories",
            let: { categoryId: { $toObjectId: "$categoryId" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } }
            ],
            as: "category"
          }
        },
        {
          $addFields: {
            category: { $arrayElemAt: ["$category", 0] }
          }
        },
        { $sort: { date: -1 } }
      ])
      .toArray();

    return res.send(transactions);
  } catch (e) {
    return res.status(500).send(e.message);
  }
}

export async function getTransactionsSummary(req, res) {
  const { authorization } = req.headers;

  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const summary = await db.collection("transactions")
      .aggregate([
        { $match: { id: user.id } },
        {
          $group: {
            _id: "$categoryId",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            type: { $first: "$type" }
          }
        },
        {
          $lookup: {
            from: "categories",
            let: { categoryId: { $toObjectId: "$_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$categoryId"] } } }
            ],
            as: "category"
          }
        },
        {
          $addFields: {
            category: { $arrayElemAt: ["$category", 0] }
          }
        },
        {
          $project: {
            categoryId: "$_id",
            categoryName: { 
              $ifNull: ["$category.name", "Sem categoria"] 
            },
            categoryType: {
              $ifNull: ["$category.type", "$type"]
            },
            totalAmount: 1,
            count: 1
          }
        },
        { $sort: { totalAmount: -1 } }
      ])
      .toArray();

    return res.send(summary);
  } catch (e) {
    return res.status(500).send(e.message);
  }
}

export async function deleteTransaction(req, res) {
  const { authorization } = req.headers;
  const { id } = req.params;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const transaction = await db.collection("transactions").findOne({ 
      _id: new ObjectId(id), 
      id: user.id 
    });
    
    if (!transaction) return res.status(404).send("Transaction not found!");

    await db.collection("transactions").deleteOne({ 
      _id: new ObjectId(id), 
      id: user.id 
    });

    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

export async function updateTransaction(req, res) {
  const { authorization } = req.headers;
  const { id } = req.params;
  const { description, amount, categoryId } = req.body;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const transaction = await db.collection("transactions").findOne({ 
      _id: new ObjectId(id), 
      id: user.id 
    });
    
    if (!transaction) return res.status(404).send("Transaction not found!");

    const updateData = {
      description: stripHtml(description).result.trim(),
      amount: parseFloat(amount.toFixed(2)),
    };

    if (categoryId) {
      const category = await db.collection("categories").findOne({
        _id: new ObjectId(categoryId),
        userId: user.id
      });
      if (!category) return res.status(400).send("Invalid category!");

      if (category.type !== transaction.type) {
        return res.status(400).send("Category type does not match transaction type!");
      }
      updateData.categoryId = categoryId;
    } else {
      updateData.categoryId = null;
    }

    await db.collection("transactions").updateOne(
      { _id: new ObjectId(id), id: user.id },
      { $set: updateData }
    );

    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}

export async function getTransactionById(req, res) {
  const { authorization } = req.headers;
  const { id } = req.params;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  try {
    const user = await db.collection("sessions").findOne({ token: token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const transaction = await db.collection("transactions").findOne({ 
      _id: new ObjectId(id), 
      id: user.id 
    });
    
    if (!transaction) return res.status(404).send("Transaction not found!");

    return res.send(transaction);
  } catch (err) {
    return res.status(500).send(err.message);
  }
}
