import { MongoClient, Db } from "mongodb";

export let client: MongoClient;
export let db: Db;

export async function connectToMongoDB(databaseUrl: string) {
  try {
    client = new MongoClient(databaseUrl);

    await client.connect();

    const resourceBaseUrl = new URL(databaseUrl);
    const dbName = resourceBaseUrl.pathname.split("/")[1];

    if (!dbName) {
      throw new Error("Database name not found");
    }

    console.error(`Connecting to database: ${dbName}`);
    db = client.db(dbName);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function closeMongoDB() {
  await client?.close();
}
