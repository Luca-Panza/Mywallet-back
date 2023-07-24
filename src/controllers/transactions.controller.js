import { stripHtml } from "string-strip-html";
import dayjs from "dayjs";
import { db } from "../database/database.connection.js";

export async function postTransaction(req, res) {
  const { authorization } = req.headers;
  const { description, amount } = req.body;
  const { type } = req.params;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  const cleanTransaction = {
    type: type,
    token: stripHtml(token).result.trim(),
    description: stripHtml(description).result.trim(),
    amount: amount,
  };

  try {
    const user = await db.collection("sessions").findOne({ token: cleanTransaction.token });
    if (!user) return res.status(401).send("Invalid token!\nPlease login again!");

    const newTransaction = await db.collection("transactions").insertOne({
      id: user.id,
      type: cleanTransaction.type,
      description: cleanTransaction.description,
      date: dayjs().toDate(),
      amount: parseFloat(amount.toFixed(2)),
    });
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

    const transactions = await db.collection("transactions").find({ id: user.id }).sort({ date: -1 }).toArray();
    return res.send(transactions);
  } catch (e) {
    return res.status(500).send(e.message);
  }
}
