import express, { json } from "express";
import { MongoClient, ObjectId } from "mongodb";
import { stripHtml } from "string-strip-html";
import cors from "cors";
import dotenv from "dotenv";
import joi from "joi";
import bcrypt from "bcrypt";
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
  name: joi.string().min(3).required(),
  email: joi.string().email().trim().required(),
  password: joi.string().min(3).required(),
});

const loginSchema = joi.object({
  email: joi.string().email().trim().required(),
  password: joi.string().min(3).required(),
});

app.post("/cadastro", async (req, res) => {
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

  cleanRegister.password = bcrypt.hashSync(password, 1);

  try {
    const validUser = await db.collection("users").findOne({ email: cleanRegister.email });
    if (validUser) return res.status(409).send("E-mail address is already used!");

    await db.collection("users").insertOne(cleanRegister);
    res.sendStatus(201);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/", async (req, res) => {
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

    const token = uuid();
    await db.collection("section").insertOne({ name: user.name, email: user.email, id: user._id, token });

    res.status(200).send({ name: user.name, token });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Port:${port}/`));
