import express from "express";
import dotenv from "dotenv";
dotenv.config();
import translateRoute from "./routes/translate";
import { fetchSchemas } from "./database/schema";
import { connectToMongoDB } from "./database/client";

export const schemaCache: Record<string, any> = {};

const app = express();

app.use(express.json());
app.use("/translate", translateRoute);

(async () => {
  await connectToMongoDB(process.env.MONGODB_URL!);
  const schemas = await fetchSchemas();
  Object.assign(schemaCache, schemas);

  console.log("Loaded collection schemas successfully");
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
