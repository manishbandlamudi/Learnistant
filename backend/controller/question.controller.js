import Question from "../models/question.model.js";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Get questions by language + level
export const getQuestionsByLanguageLevel = async (req, res) => {
  try {
    const { language, level } = req.params;
    const questions = await Question.find({ language, level })
      .select("-testCases")
      .sort({ createdAt: 1 });

    res.json({ success: true, questions, count: questions.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get single question
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }
    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Daily challenge (Gemini AI)
export const getDailyChallenge = async (req, res) => {
  try {
    const today = new Date().toDateString();
    const cachedChallenge = await Question.findOne({
      isDailyChallenge: true,
      challengeDate: today,
    });

    if (cachedChallenge) {
      return res.json({ success: true, question: cachedChallenge, isFromCache: true });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate a coding problem in valid JSON (no markdown, no explanation).
{
  "title": "Problem Title",
  "description": "Problem description",
  "difficulty": "medium",
  "topic": "Arrays/Strings/etc",
  "sampleInput": "Example input",
  "sampleOutput": "Example output",
  "concepts": ["concept1","concept2"],
  "starterCode": {
    "python": "def solution():\\n    pass",
    "java": "public class Solution { }",
    "cpp": "class Solution { };"
  },
  "testCases": [
    {"input": "test1", "expectedOutput": "output1"}
  ]
}`;

    const result = await model.generateContent(prompt);
    let text = await result.response.text();

    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let generatedQuestion;
    try {
      generatedQuestion = JSON.parse(text);
    } catch (err) {
      console.error("Gemini returned invalid JSON:", text);
      return res.status(500).json({
        success: false,
        message: "AI response invalid JSON",
        raw: text,
      });
    }

    const dailyChallenge = new Question({
      ...generatedQuestion,
      language: "all",
      level: 3,
      isDailyChallenge: true,
      challengeDate: today,
    });

    await dailyChallenge.save();
    res.json({ success: true, question: dailyChallenge, isFromCache: false });
  } catch (error) {
    console.error("Daily challenge error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Submit solution via Judge0
export const submitSolution = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    const languageMap = { python: 71, java: 62, cpp: 54 };
    const languageId = languageMap[language];
    if (!languageId) return res.status(400).json({ success: false, message: "Unsupported language" });

    let allPassed = true;
    const results = [];

    for (const testCase of question.testCases) {
      try {
        const submission = {
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
          expected_output: testCase.expectedOutput,
        };

        const submitResponse = await axios.post(
          `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
          submission,
          { headers: { "Content-Type": "application/json" } }
        );

        const result = submitResponse.data;
        const passed = result.stdout?.trim() === testCase.expectedOutput.trim();

        results.push({
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: result.stdout,
          passed,
          error: result.stderr,
          status: result.status?.description,
        });

        if (!passed) allPassed = false;
      } catch (err) {
        results.push({ input: testCase.input, expected: testCase.expectedOutput, passed: false, error: "Execution failed" });
        allPassed = false;
      }
    }

    res.json({ success: true, allPassed, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ AI Guidance (when user fails)
export const getAIGuidance = async (req, res) => {
  try {
    const { questionId, userCode, language, failedTestCases } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Student failed solving this problem:

Title: ${question.title}
Description: ${question.description}

Code (${language}):
${userCode}

Failed test cases: ${JSON.stringify(failedTestCases)}

Explain mistakes, core concepts, step-by-step fix, and give learning roadmap.`;

    const result = await model.generateContent(prompt);
    const guidance = await result.response.text();

    res.json({
      success: true,
      guidance,
      topic: question.topic,
      concepts: question.concepts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "AI guidance failed" });
  }
};
