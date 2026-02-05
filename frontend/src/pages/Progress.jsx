import React, { useState } from 'react';
import { Calendar, Download, RotateCcw, Settings, Play, CheckCircle, Circle, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

const LearningDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(14);

  const languages = [
    {
      name: 'Java',
      icon: '☕',
      color: 'bg-orange-500',
      modules: '17/24 modules',
      progress: 72,
      averageScore: '85%',
      lastActivity: '2 hours ago',
      recentTopics: ['Spring Boot', 'JPA', 'Microservices'],
      recommendedNext: 'Advanced Spring Security'
    },
    {
      name: 'Python',
      icon: '🐍',
      color: 'bg-blue-500',
      modules: '16/18 modules',
      progress: 89,
      averageScore: '92%',
      lastActivity: '1 day ago',
      recentTopics: ['Pandas', 'Machine Learning', 'Django'],
      recommendedNext: 'Deep Learning with TensorFlow'
    },
    {
      name: 'C++',
      icon: '⚡',
      color: 'bg-purple-500',
      modules: '9/20 modules',
      progress: 45,
      averageScore: '78%',
      lastActivity: '3 days ago',
      recentTopics: ['Pointers', 'STL', 'OOP Concepts'],
      recommendedNext: 'Advanced Data Structures'
    }
  ];

  const learningGoals = [
    { text: 'Master React Hooks', completed: true },
    { text: 'Complete Python Data Science Track', completed: false },
    { text: 'Build Full-Stack Application', completed: false }
  ];

  const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const activeDays = [8, 12, 13, 15, 17, 24];

  const CircularProgress = ({ percentage, size = 60 }) => {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-blue-500 transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-600">AJ</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">Alex Johnson</h1>
                <p className="text-sm text-gray-500">Intermediate Developer</p>
                <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                  <span>🔥 19 day streak</span>
                  <span>⏰ 147 hours</span>
                </div>
              </div>
            </div>
            <Settings className="w-5 h-5 text-gray-400 cursor-pointer" />
          </div>

          {/* Learning Goals */}
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Learning Goals</span>
            </div>
            <div className="space-y-2">
              {learningGoals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {goal.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  <span className={`text-sm ${goal.completed ? 'text-green-700' : 'text-gray-600'}`}>
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Programming Languages */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-xs">📚</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Programming Languages</h2>
              </div>

              <div className="space-y-6">
                {languages.map((lang, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${lang.color} rounded text-white flex items-center justify-center text-sm`}>
                          {lang.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{lang.name}</h3>
                          <p className="text-xs text-gray-500">{lang.modules}</p>
                        </div>
                      </div>
                      <CircularProgress percentage={lang.progress} size={50} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Average Score</p>
                        <p className="font-medium text-gray-800">{lang.averageScore}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Last Activity</p>
                        <p className="font-medium text-gray-800">{lang.lastActivity}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-1">Recent Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {lang.recentTopics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Recommended Next</p>
                        <p className="font-medium text-gray-800 text-sm">{lang.recommendedNext}</p>
                      </div>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                        <Play className="w-3 h-3" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Learning Calendar */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-gray-800">Learning Calendar</h2>
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-gray-500 py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      p-2 text-sm rounded transition-colors relative
                      ${selectedDate === day 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {day}
                    {activeDays.includes(day) && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700">Tuesday, September 23, 2025</p>
                <p className="text-xs text-gray-500 mt-1">No sessions scheduled</p>
              </div>
            </div>

            {/* AI Learning Insights */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                  <Lightbulb className="w-3 h-3 text-purple-600" />
                </div>
                <h2 className="font-semibold text-gray-800">AI Learning Insights</h2>
              </div>

              <div className="space-y-4">
                {/* Strengths */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Strengths</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 ml-6">
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Excellent problem-solving approach</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Strong understanding of OOP concepts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Consistent learning schedule</span>
                    </div>
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">Areas for Improvement</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 ml-6">
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Need more practice with algorithms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Could improve debugging techniques</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>More focus on code optimization</span>
                    </div>
                  </div>
                </div>

                {/* Personalized Suggestions */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">Personalized Suggestions</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 ml-6">
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Try building a project combining Java and Python</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Practice on HackerRank for algorithm skills</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Consider learning Git workflows</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>Join a coding community for peer learning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Privacy & Data</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Download Progress Data</p>
                    <p className="text-xs text-gray-500">Export all your learning data and progress</p>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reset All Progress</p>
                    <p className="text-xs text-gray-500">Permanently delete all learning data</p>
                  </div>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;