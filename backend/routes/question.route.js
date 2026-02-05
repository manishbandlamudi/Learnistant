import express from "express";
import {
  getQuestionsByLanguageLevel,
  getQuestionById,
  getDailyChallenge,
  submitSolution,
  getAIGuidance,
} from "../controller/question.controller.js";

const router = express.Router();

// Move specific routes BEFORE parameterized ones
router.get("/daily-challenge", getDailyChallenge);
router.get("/single/:id", getQuestionById);
router.post("/submit-solution", submitSolution);
router.post("/ai-guidance", getAIGuidance);
router.get("/:language/:level", getQuestionsByLanguageLevel); // Move this to the end

export default router;
