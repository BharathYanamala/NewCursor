import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Results.css';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results } = location.state || {};

  if (!results) {
    navigate('/dashboard');
    return null;
  }

  const { score, totalQuestions, results: questionResults } = results;
  const percentage = ((score / totalQuestions) * 100).toFixed(1);
  const correctCount = questionResults.filter(r => r.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Quiz Results</h2>
        <div className="score-summary">
          <div className="score-circle">
            <div className="score-value">{score}/{totalQuestions}</div>
            <div className="score-percentage">{percentage}%</div>
          </div>
          <div className="score-stats">
            <div className="stat-item correct">
              <span className="stat-label">Correct</span>
              <span className="stat-value">{correctCount}</span>
            </div>
            <div className="stat-item incorrect">
              <span className="stat-label">Incorrect</span>
              <span className="stat-value">{incorrectCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="results-review">
        <h3>Question Review</h3>
        {questionResults.map((result, index) => (
          <div key={result.questionId} className="result-item">
            <div className="result-question-header">
              <span className="question-number">Question {index + 1}</span>
              <span className={`result-badge ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>
            
            <p className="result-question-text">{result.questionText}</p>

            {result.questionType === 'objective' ? (
              <div className="result-options">
                {result.options.map(option => {
                  const isUserAnswer = option.letter === result.userAnswer;
                  const isCorrectAnswer = option.letter === result.correctAnswer;
                  
                  let className = 'result-option';
                  if (isCorrectAnswer) {
                    className += ' correct-answer';
                  } else if (isUserAnswer && !result.isCorrect) {
                    className += ' incorrect-answer';
                  }

                  return (
                    <div key={option.letter} className={className}>
                      <span className="option-letter">{option.letter}.</span>
                      <span className="option-text">{option.text}</span>
                      {isCorrectAnswer && <span className="checkmark">✓</span>}
                      {isUserAnswer && !result.isCorrect && <span className="crossmark">✗</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="fill-blank-result">
                <div className="answer-comparison">
                  <div className="answer-item">
                    <span className="answer-label">Your Answer:</span>
                    <span className={`answer-value ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.userAnswer || '(No answer)'}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="answer-item">
                      <span className="answer-label">Correct Answer:</span>
                      <span className="answer-value correct">{result.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="results-actions">
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Back to Dashboard
        </button>
        <button onClick={() => navigate('/quiz')} className="btn-secondary">
          Take Another Quiz
        </button>
      </div>
    </div>
  );
}

export default Results;

