import React, { useState } from 'react';

const sampleQuestions = {
  technical: [
    {
      id: 1,
      question: "What is the difference between let, const, and var in JavaScript?",
      category: "JavaScript",
      difficulty: "Medium"
    },
    {
      id: 2,
      question: "Explain the concept of virtual DOM in React.",
      category: "React",
      difficulty: "Medium"
    },
    // Add more technical questions
  ],
  behavioral: [
    {
      id: 1,
      question: "Tell me about a challenging project you worked on.",
      category: "Problem Solving",
      difficulty: "Medium"
    },
    {
      id: 2,
      question: "How do you handle conflicts in a team?",
      category: "Team Work",
      difficulty: "Medium"
    },
    // Add more behavioral questions
  ]
};

export default function InterviewPrep() {
  const [activeTab, setActiveTab] = useState('technical');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [savedAnswers, setSavedAnswers] = useState({});

  const handleSaveAnswer = (questionId) => {
    setSavedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    setAnswer('');
    setSelectedQuestion(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Interview Preparation</h2>

      {/* Question Type Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('technical')}
          className={"px-4 py-2 rounded " + (activeTab === 'technical' ? 'bg-blue-600 text-white' : 'bg-gray-200')}
        >
          Technical Questions
        </button>
        <button
          onClick={() => setActiveTab('behavioral')}
          className={"px-4 py-2 rounded " + (activeTab === 'behavioral' ? 'bg-blue-600 text-white' : 'bg-gray-200')}
        >
          Behavioral Questions
        </button>
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Practice Questions</h3>
          {sampleQuestions[activeTab].map((q) => (
            <div
              key={q.id}
              className={"p-4 border rounded-lg cursor-pointer hover:border-blue-500 " + (selectedQuestion?.id === q.id ? 'border-blue-500 bg-blue-50' : '')}
              onClick={() => setSelectedQuestion(q)}
            >
              <p className="font-medium">{q.question}</p>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>{q.category}</span>
                <span>Difficulty: {q.difficulty}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Answer Section */}
        <div className="space-y-4">
          {selectedQuestion ? (
            <>
              <h3 className="text-lg font-semibold">Your Answer</h3>
              <div className="space-y-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full h-48 p-4 border rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Write your answer here..."
                />
                <button
                  onClick={() => handleSaveAnswer(selectedQuestion.id)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Answer
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a question to start practicing
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{
              width: ((Object.keys(savedAnswers).length / (sampleQuestions.technical.length + sampleQuestions.behavioral.length)) * 100) + '%'
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {Object.keys(savedAnswers).length} questions answered out of{' '}
          {sampleQuestions.technical.length + sampleQuestions.behavioral.length}
        </p>
      </div>
    </div>
  );
}
