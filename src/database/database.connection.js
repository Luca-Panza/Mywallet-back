import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Carregar variáveis de ambiente do arquivo correto baseado no ambiente
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const databaseUrl = process.env.DATABASE_URL;
const mongoClient = new MongoClient(databaseUrl);

try {
  await mongoClient.connect();
  if (process.env.NODE_ENV !== 'test') {
    console.log("MongoDB Connected!");
  }
} catch (err) {
  console.log(err.message);
}

export const db = mongoClient.db();
export { mongoClient };