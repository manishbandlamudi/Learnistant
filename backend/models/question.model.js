import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  language: {
    type: String,
    enum: ['python', 'java', 'cpp', 'all'], // Added 'all' for daily challenges
    required: true
  },
  level: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'very-hard', 'expert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sampleInput: String,
  sampleOutput: String,
  testCases: [{
    input: String,
    expectedOutput: String
  }],
  topic: String,
  concepts: [String],
  starterCode: {
    python: String,
    java: String,
    cpp: String
  },
  // Daily challenge specific fields
  isDailyChallenge: {
    type: Boolean,
    default: false
  },
  challengeDate: String, // Store date as string for easy comparison
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for daily challenge queries
questionSchema.index({ isDailyChallenge: 1, challengeDate: 1 });

export default mongoose.model('Question', questionSchema);