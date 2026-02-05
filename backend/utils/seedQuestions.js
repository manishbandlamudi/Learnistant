import dotenv from "dotenv";
dotenv.config();
import connectDb from "../config/db.js";
import Question from "../models/question.model.js";

const sampleQuestions = [
  {
    language: "python",
    level: 1,
    difficulty: "easy",
    title: "Reverse an Array",
    description: "Write a function to reverse an array in-place.",
    sampleInput: "[1,2,3]",
    sampleOutput: "[3,2,1]",
    topic: "Arrays",
    concepts: ["Two pointers"],
    starterCode: {
      python: "def reverse_array(arr):\n    # TODO\n    return arr",
      java: "public class Solution { }",
      cpp: "class Solution { };",
    },
    testCases: [
      { input: "[1,2,3]", expectedOutput: "[3,2,1]" },
      { input: "[10,20]", expectedOutput: "[20,10]" },
    ],
  },
];

const seed = async () => {
  try {
    await connectDb();
    await Question.deleteMany({});
    await Question.insertMany(sampleQuestions);
    console.log("✅ Questions seeded!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding:", error);
    process.exit(1);
  }
};

seed();
