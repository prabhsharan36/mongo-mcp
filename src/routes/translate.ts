import express from "express";
import { generateMongoQuery } from "../modules/queryGenerator";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    const mongoQuery = await generateMongoQuery(query);

    res.json({ mongoQuery });
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "Failed to translate query" });
  }
});

export default router;
