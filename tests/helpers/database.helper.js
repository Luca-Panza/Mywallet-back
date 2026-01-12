import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

let mongoClient;
let db;

export async function connectTestDatabase() {
  if (db) {
    return db;
  }
  
  const databaseUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/mywallet-test';
  
  mongoClient = new MongoClient(databaseUrl);
  
  try {
    await mongoClient.connect();
    db = mongoClient.db();
    return db;
  } catch (err) {
    console.error("Error connecting to test database:", err.message);
    throw err;
  }
}

export async function clearDatabase() {
  if (!db) {
    throw new Error("Database not connected");
  }

  const collections = await db.listCollections().toArray();
  
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
}

export async function closeDatabase() {
  if (mongoClient) {
    await mongoClient.close();
  }
}

export async function createUserWithSession(userData = {}) {
  if (!db) {
    throw new Error("Database not connected");
  }

  const hashedPassword = bcrypt.hashSync(userData.password || 'password123', 10);
  
  const user = {
    name: userData.name || 'Test User',
    email: userData.email || 'test@test.com',
    password: hashedPassword,
  };

  const result = await db.collection("users").insertOne(user);
  
  const token = uuid();
  await db.collection("sessions").insertOne({ 
    id: result.insertedId, 
    token 
  });

  return {
    user: { ...user, _id: result.insertedId },
    token
  };
}

export function getDb() {
  if (!db) {
    throw new Error("Database not connected");
  }
  return db;
}
