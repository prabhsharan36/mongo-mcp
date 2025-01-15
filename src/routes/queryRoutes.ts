import { NextFunction, Request, Response, Router } from "express";
import { handleNaturalLanguageQuery } from "../controllers/queryController";

const router = Router();

router.post("/natural-language/query", (req: Request, res: Response) => {
  handleNaturalLanguageQuery(req, res);
});

export default router;
