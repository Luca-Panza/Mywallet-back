import { stripHtml } from "string-strip-html";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import { db } from "../database/database.connection.js";

export async function signUp(req, res) {
  const { name, email, password } = req.body;

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
}

export async function signIn(req, res) {
  const { email, password } = req.body;

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
}
