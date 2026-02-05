import React, { useState, useEffect } from "react";
import {
  Calendar,
  Trophy,
  ChevronRight,
  Target,
  ArrowLeft,
  Send,
  Brain,
} from "lucide-react";

/**
 * DSAHub.jsx - FIXED VERSION
 * Key fixes:
 * 1. Added proper loading state management in fetchQuestions
 * 2. Added error handling and user feedback
 * 3. Fixed the questions display logic
 * 4. Added loading states for better UX
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const languages = [
  {
    name: "Python",
    key: "python",
    icon: "🐍",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    hoverColor: "hover:from-blue-600 hover:to-blue-700",
    description: "Master Python with 25 structured problems",
  },
  {
    name: "Java",
    key: "java",
    icon: "☕",
    color: "bg-gradient-to-br from-orange-500 to-red-500",
    hoverColor: "hover:from-orange-600 hover:to-red-600",
    description: "Object-oriented programming challenges",
  },
  {
    name: "C++",
    key: "cpp",
    icon: "⚡",
    color: "bg-gradient-to-br from-purple-500 to-indigo-600",
    hoverColor: "hover:from-purple-600 hover:to-indigo-700",
    description: "System programming and algorithms",
  },
];

const levels = [
  { level: 1, name: "Level 1", difficulty: "Easy", color: "text-green-600 bg-green-100", icon: "🌱" },
  { level: 2, name: "Level 2", difficulty: "Medium", color: "text-blue-600 bg-blue-100", icon: "🔥" },
  { level: 3, name: "Level 3", difficulty: "Hard", color: "text-orange-600 bg-orange-100", icon: "💪" },
  { level: 4, name: "Level 4", difficulty: "Very Hard", color: "text-red-600 bg-red-100", icon: "🚀" },
  { level: 5, name: "Level 5", difficulty: "Expert", color: "text-purple-600 bg-purple-100", icon: "👑" },
];

const DSAHub = () => {
  const [currentView, setCurrentView] = useState("home");
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [aiGuidance, setAiGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false); // Separate loading state for questions
  const [error, setError] = useState(null);

  const log = (...args) => console.log("[DSAHub]", ...args);

  useEffect(() => {
    fetchDailyChallenge();
  }, []);

  const fetchDailyChallenge = async () => {
    try {
      setLoading(true);
      setError(null);
      log("Fetching daily challenge...");
      const res = await fetch(`${API_BASE}/api/questions/daily-challenge`);
      const data = await res.json();
      log("Daily challenge response:", data);
      if (data?.success) {
        setDailyChallenge(data.question);
      } else {
        setError("Failed to load daily challenge");
      }
    } catch (err) {
      console.error("Error fetching daily challenge:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Added proper loading state management
  const fetchQuestions = async (languageKey, levelNumber) => {
    try {
      setQuestionsLoading(true); // Set loading to true at start
      setError(null);
      setQuestions([]); // Clear previous questions
      
      log("fetchQuestions:", languageKey, levelNumber);
      const res = await fetch(`${API_BASE}/api/questions/${languageKey}/${levelNumber}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      log("fetchQuestions -> parsed:", data);
      
      if (data?.success) {
        setQuestions(data.questions || []);
        if (data.questions?.length === 0) {
          setError("No questions found for this level");
        }
        return true;
      } else {
        setError(data?.message || "Failed to load questions");
        setQuestions([]);
        return false;
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setError(`Failed to load questions: ${err.message}`);
      setQuestions([]);
      return false;
    } finally {
      setQuestionsLoading(false); // Always set loading to false
    }
  };

  const fetchQuestionById = async (questionId) => {
    try {
      setLoading(true);
      setError(null);
      log("fetchQuestionById:", questionId);
      const res = await fetch(`${API_BASE}/api/questions/single/${questionId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      log("fetchQuestionById -> parsed:", data);
      
      if (data?.success) {
        setCurrentQuestion(data.question);
        const starter = data.question.starterCode?.[selectedLanguage?.key] || 
                       data.question.starterCode?.python || 
                       "// Write your code here";
        setUserCode(starter);
      } else {
        setError(data?.message || "Question not found");
      }
    } catch (err) {
      console.error("Error fetching question:", err);
      setError(`Failed to load question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const submitSolution = async () => {
    if (!currentQuestion) {
      setError("No current question selected.");
      return;
    }
    if (!selectedLanguage) {
      setError("No language selected.");
      return;
    }

    try {
      setLoading(true);
      setSubmissionResult(null);
      setAiGuidance(null);
      setError(null);

      log("Submitting solution", currentQuestion._id, selectedLanguage.key);
      const res = await fetch(`${API_BASE}/api/questions/submit-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          code: userCode,
          language: selectedLanguage.key,
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      log("submitSolution -> parsed:", data);
      setSubmissionResult(data);

      if (!data?.allPassed && data?.results) {
        const failedTests = data.results.filter((r) => !r.passed);
        await getAIGuidance(failedTests);
      }
    } catch (err) {
      console.error("Error submitting solution:", err);
      setError(`Submission failed: ${err.message}`);
      setSubmissionResult({ success: false, message: "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const getAIGuidance = async (failedTestCases) => {
    try {
      log("Requesting AI guidance, failedTestCases:", failedTestCases);
      const res = await fetch(`${API_BASE}/api/questions/ai-guidance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          userCode,
          language: selectedLanguage.key,
          failedTestCases,
        }),
      });
      
      const data = await res.json();
      log("AI guidance response:", data);
      
      if (data?.success) {
        setAiGuidance(data);
      } else {
        setAiGuidance({ guidance: data?.message || "No guidance available." });
      }
    } catch (err) {
      console.error("Error fetching AI guidance:", err);
      setAiGuidance({ guidance: "AI guidance failed. Try again later." });
    }
  };

  const handleLanguageSelect = (lang) => {
    log("Language selected:", lang);
    setSelectedLanguage(lang);
    setSelectedLevel(null);
    setQuestions([]);
    setCurrentQuestion(null);
    setSubmissionResult(null);
    setAiGuidance(null);
    setError(null);
    setCurrentView("language");
  };

  const handleLevelSelect = async (lvl) => {
    if (!selectedLanguage) {
      setError("No language selected. Please select a language first.");
      return;
    }
    
    log("Level selected:", lvl);
    setSelectedLevel(lvl);
    setQuestions([]);
    setSubmissionResult(null);
    setAiGuidance(null);
    setError(null);

    // Fetch questions for this level
    await fetchQuestions(selectedLanguage.key, lvl.level);
    setCurrentView("language");
  };

  const handleQuestionSelect = (question) => {
    log("Question selected:", question._id || question.title);
    setCurrentQuestion(null);
    setSubmissionResult(null);
    setAiGuidance(null);
    setError(null);
    fetchQuestionById(question._id);
    setCurrentView("question");
  };

  const handleDailyChallengeSelect = () => {
    if (!dailyChallenge) {
      setError("Daily challenge not loaded.");
      return;
    }
    log("Daily challenge selected:", dailyChallenge._id);
    setCurrentQuestion(dailyChallenge);
    setUserCode(dailyChallenge.starterCode?.python || "// Write your solution here");
    setCurrentView("challenge");
    setSubmissionResult(null);
    setAiGuidance(null);
    setError(null);
  };

  // Error display component
  const ErrorDisplay = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error:</strong> {message}
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">DSA Mastery Hub</h1>
          <p className="text-gray-600 text-lg">Choose your path to programming excellence</p>
        </div>

        {error && <ErrorDisplay message={error} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {languages.map((lang) => (
            <div
              key={lang.key}
              onClick={() => handleLanguageSelect(lang)}
              className={`${lang.color} ${lang.hoverColor} cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-xl p-6 text-white`}
            >
              <div className="text-4xl mb-4">{lang.icon}</div>
              <h3 className="text-xl font-bold mb-2">{lang.name}</h3>
              <p className="text-white/90 text-sm mb-4">{lang.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">5 Levels • 25 Problems</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          ))}

          <div
            onClick={handleDailyChallengeSelect}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-xl p-6 text-white"
          >
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Daily Challenge</h3>
            <p className="text-white/90 text-sm mb-4">AI-powered random challenge</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {loading ? "Loading..." : dailyChallenge ? dailyChallenge.difficulty : "Click to load"}
              </span>
              <Calendar className="w-5 h-5" />
            </div>
            {dailyChallenge && (
              <div className="mt-3 text-xs bg-white/20 rounded-lg p-2">
                <strong>{dailyChallenge.title}</strong>
                <br />Topic: {dailyChallenge.topic}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => {
              setCurrentView("home");
              setSelectedLanguage(null);
              setSelectedLevel(null);
              setQuestions([]);
              setError(null);
            }}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{selectedLanguage?.icon}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{selectedLanguage?.name}</h1>
          <p className="text-gray-600">Choose your skill level</p>
        </div>

        {error && <ErrorDisplay message={error} />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level) => (
            <div
              key={level.level}
              onClick={() => handleLevelSelect(level)}
              className="bg-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl p-6 border border-gray-200"
            >
              <div className="text-3xl mb-4">{level.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{level.name}</h3>
              <p className={`text-sm font-medium mb-4 px-3 py-1 rounded-full inline-block ${level.color}`}>
                {level.difficulty}
              </p>
              <p className="text-gray-600 text-sm mb-4">5 carefully selected problems</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Click to start</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* FIXED: Questions list with proper loading states */}
        {selectedLevel && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedLevel.name} Problems</h2>

            {questionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading problems...</div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {error ? "Failed to load questions. Please try again." : "No problems found for this level."}
                </div>
                {error && (
                  <button 
                    onClick={() => handleLevelSelect(selectedLevel)}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {questions.map((q, idx) => (
                  <div
                    key={q._id || idx}
                    onClick={() => handleQuestionSelect(q)}
                    className="bg-white cursor-pointer hover:shadow-md transition-shadow rounded-lg p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {idx + 1}. {q.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">{q.description}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            levels.find(l => l.level === q.level)?.color || 'bg-gray-100'
                          }`}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-gray-500">Topic: {q.topic}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentView("language")} className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Problems
          </button>
        </div>

        {error && <ErrorDisplay message={error} />}

        {currentQuestion ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Description */}
            <div className="bg-white rounded-lg p-6 h-fit">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{currentQuestion.title}</h1>
              <p className="text-gray-600 mb-6">{currentQuestion.description}</p>

              {currentQuestion.sampleInput && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Sample Input:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm">{currentQuestion.sampleInput}</pre>
                </div>
              )}

              {currentQuestion.sampleOutput && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Sample Output:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm">{currentQuestion.sampleOutput}</pre>
                </div>
              )}

              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm text-gray-500">Topic: {currentQuestion.topic}</span>
                <span className="text-sm text-gray-500">Level: {currentQuestion.level}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${levels.find(l => l.level === currentQuestion.level)?.color || ''}`}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              {currentQuestion.concepts && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Concepts:</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.concepts.map((c, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Editor & Results */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Your Solution ({selectedLanguage?.name || "Language"})</h3>
                <button
                  onClick={submitSolution}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? "Running..." : "Submit"}</span>
                </button>
              </div>

              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
                placeholder="// Write your solution here"
              />

              {/* Results */}
              {submissionResult && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Results:</h3>
                  <div className={`p-4 rounded-lg mb-4 ${submissionResult.allPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {submissionResult.allPassed ? (
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5" />
                        <span>All tests passed! Great job! 🎉</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-5 h-5" />
                          <span>{submissionResult.passedTests}/{submissionResult.totalTests} tests passed</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {submissionResult.results && (
                    <div className="space-y-2">
                      {submissionResult.results.map((r, i) => (
                        <div key={i} className={`p-3 rounded border ${r.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="text-sm"><strong>Test {i + 1}:</strong> {r.passed ? '✅ Passed' : '❌ Failed'}</div>
                          {!r.passed && (
                            <div className="text-xs mt-1 text-gray-600">
                              <div>Expected: {r.expected}</div>
                              <div>Got: {r.actual || 'No output'}</div>
                              {r.error && <div>Error: {r.error}</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Guidance */}
              {aiGuidance && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">AI Guidance</h3>
                  </div>
                  <div className="text-sm text-blue-700 whitespace-pre-wrap">{aiGuidance.guidance || aiGuidance}</div>
                  {aiGuidance.recommendedStudyPath && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Recommended Study Path:</h4>
                      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        {aiGuidance.recommendedStudyPath.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{loading ? "Loading question..." : "Question not found"}</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderChallenge = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => setCurrentView("home")} className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          <div className="flex items-center space-x-2 text-purple-600">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Daily Challenge</span>
          </div>
        </div>

        {error && <ErrorDisplay message={error} />}

        {currentQuestion ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border-t-4 border-purple-500">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-800">{currentQuestion.title}</h1>
              </div>
              <p className="text-gray-600 mb-6">{currentQuestion.description}</p>
              
              {currentQuestion.sampleInput && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Sample Input:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm">{currentQuestion.sampleInput}</pre>
                </div>
              )}
              
              {currentQuestion.sampleOutput && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Sample Output:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm">{currentQuestion.sampleOutput}</pre>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Your Solution</h3>
                <button 
                  onClick={submitSolution} 
                  disabled={loading} 
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? "Running..." : "Submit"}</span>
                </button>
              </div>

              <textarea 
                value={userCode} 
                onChange={(e) => setUserCode(e.target.value)} 
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50" 
              />

              {submissionResult && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Results:</h3>
                  <div className={`p-4 rounded-lg mb-4 ${submissionResult.allPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {submissionResult.allPassed ? (
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5" />
                        <span>Daily Challenge Completed! 🎉</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-5 h-5" />
                        <span>{submissionResult.passedTests}/{submissionResult.totalTests} tests passed</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {aiGuidance && (
                <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">AI Mentor</h3>
                  </div>
                  <div className="text-sm text-purple-700 whitespace-pre-wrap">{aiGuidance.guidance}</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">{loading ? "Loading challenge..." : "Challenge not found"}</div>
          </div>
        )}
      </div>
    </div>
  );

  // Main render switch
  if (currentView === "home") return renderHome();
  if (currentView === "language") return renderLanguage();
  if (currentView === "question") return renderQuestion();
  if (currentView === "challenge") return renderChallenge();

  return null;
};

export default DSAHub;