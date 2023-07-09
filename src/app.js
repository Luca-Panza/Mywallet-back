import express, { json } from "express";
import { MongoClient, ObjectId } from "mongodb";
import { stripHtml } from "string-strip-html";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

dotenv.config();
const app = express();
app.use(cors());
app.use(json());

const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
  await mongoClient.connect();
  console.log("MongoDB Connected!");
} catch (err) {
  console.log(err.message);
}
const db = mongoClient.db();

//Schemas:
const registerSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().trim().required(),
  password: joi.string().min(3).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().trim().required(),
  password: joi.string().required(),
});

const transactionSchema = joi.object({
  type: joi.string().allow("entrada", "saida").only().required(),
  token: joi.string().min(36).max(36).required(),
  description: joi.string().min(4).required(),
  amount: joi.number().min(0.01).required(),
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const validation = registerSchema.validate({ name, email, password }, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const cleanRegister = {
    name: stripHtml(name).result.trim(),
    email: stripHtml(email).result.trim(),
    password: stripHtml(password).result.trim(),
  };

  cleanRegister.password = bcrypt.hashSync(password, 10);

  try {
    const validUser = await db.collection("users").findOne({ email: cleanRegister.email });
    if (validUser) return res.status(409).send("E-mail address is already used!");

    await db.collection("users").insertOne(cleanRegister);
    res.sendStatus(201);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const validation = loginSchema.validate({ email, password }, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const cleanLogin = {
    email: stripHtml(email).result.trim(),
    password: stripHtml(password).result.trim(),
  };

  try {
    const user = await db.collection("users").findOne({ email: cleanLogin.email });
    if (!user) return res.status(404).send("User not found");

    const passwordValidation = bcrypt.compareSync(cleanLogin.password, user.password);
    if (!passwordValidation) return res.status(401).send("Wrong password");

    await db.collection("sessions").deleteOne({ id: user._id });
    const token = uuid();
    await db.collection("sessions").insertOne({ id: user._id, token });

    res.status(200).send({ name: user.name, token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/new-transaction/:type", async (req, res) => {
  const { authorization } = req.headers;
  const { description, amount } = req.body;
  const { type } = req.params;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).send("Invalid token!\nPlease login again!");

  const validation = transactionSchema.validate({ type, token, description, amount }, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

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
});

app.get("/transactions", async (req, res) => {
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
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Port:${port}/`));
