import express from "express";
import { getSeedQuestions } from "../utils/seedData.js";

const router = express.Router();

router.get("/questions", (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count || "15", 10), 50);
    const categories = (req.query.categories || "").split(",").map(s => s.trim()).filter(Boolean);
    const questions = getSeedQuestions(count, categories);
    // return wrapped object so frontend can consistently read res.data.questions or res.questions
    return res.json({ questions });
  } catch (err) {
    console.error("GET /questions error:", err);
    return res.status(500).json({ error: "Failed to load questions" });
  }
});

export default router;