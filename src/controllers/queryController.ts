import { NextFunction, Request, Response } from "express";
import { generateMongoQuery } from "../services/queryService";
import mongoose from "mongoose";

export const handleNaturalLanguageQuery = async (
  req: Request,
  res: Response
) => {
  try {
    //TODO: add validations
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const mongoQuery = await generateMongoQuery(query);

    if (!mongoQuery) {
      return res.status(500).json({ error: "Failed to generate query" });
    }

    const result = await mongoose.connection
      .db!.collection("data")
      .find(mongoQuery)
      .toArray();

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error handling query:", error);

    return res.status(500).json({ error: "Internal Server Error" });
  }
};
