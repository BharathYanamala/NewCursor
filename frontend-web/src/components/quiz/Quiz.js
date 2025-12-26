import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Quiz.css';

function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAttemptId, setQuizAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    startQuiz();
  }, []);

  const startQuiz = async () => {
    try {
      const response = await api.post('/quiz/start');
      setQuestions(response.data.questions);
      setQuizAttemptId(response.data.quizAttemptId);
      setLoading(false);
    } catch (error) {
      console.error('Failed to start quiz:', error);
      alert('Failed to start quiz. Please try again.');
      navigate('/dashboard');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) {
        return;
      }
    }

    try {
      const answersArray = questions.map(q => ({
        questionId: q.id,
        userAnswer: answers[q.id] || ''
      }));

      const response = await api.post('/quiz/submit', {
        quizAttemptId,
        answers: answersArray
      });

      navigate('/results', { state: { results: response.data } });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  const handleQuit = async () => {
    const answeredCount = Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length;
    
    if (answeredCount === 0) {
      if (!window.confirm('You haven\'t answered any questions. Are you sure you want to quit?')) {
        return;
      }
    } else {
      if (!window.confirm(`You have answered ${answeredCount} out of ${questions.length} questions. Are you sure you want to quit? Your progress will be saved.`)) {
        return;
      }
    }

    try {
      // Submit only answered questions
      const answersArray = questions
        .filter(q => answers[q.id] && answers[q.id].trim() !== '')
        .map(q => ({
          questionId: q.id,
          userAnswer: answers[q.id]
        }));

      const response = await api.post('/quiz/quit', {
        quizAttemptId,
        answers: answersArray
      });

      navigate('/results', { state: { results: response.data } });
    } catch (error) {
      console.error('Failed to quit quiz:', error);
      alert('Failed to quit quiz. Please try again.');
    }
  };

  if (loading) {
    return <div className="quiz-loading">Loading quiz...</div>;
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>Quiz</h2>
          <button
            onClick={handleQuit}
            className="quit-btn"
          >
            Quit Quiz
          </button>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p>Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      <div className="question-card">
        <div className="question-header">
          <span className="complexity-badge">{question.complexityLevel}</span>
          <span className="question-type">{question.questionType}</span>
        </div>
        
        <h3 className="question-text">{question.questionText}</h3>

        {question.questionType === 'objective' ? (
          <div className="options-container">
            {question.options.map(option => (
              <label key={option.letter} className="option-label">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.letter}
                  checked={answers[question.id] === option.letter}
                  onChange={() => handleAnswerChange(question.id, option.letter)}
                />
                <span className="option-letter">{option.letter}.</span>
                <span className="option-text">{option.text}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="fill-blank-container">
            <input
              type="text"
              className="fill-blank-input"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer"
            />
          </div>
        )}
      </div>

      <div className="quiz-navigation">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="nav-btn"
        >
          Previous
        </button>
        
        <div className="question-indicators">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              className={`indicator ${idx === currentQuestion ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestion(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button onClick={handleSubmit} className="submit-btn">
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            className="nav-btn"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;

