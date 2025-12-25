import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleStartQuiz = () => {
    navigate('/quiz');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Quiz Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="btn-secondary">
              Admin Panel
            </button>
          )}
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Ready to test your knowledge?</h2>
          <p>Each quiz contains 10 questions with varying complexity levels.</p>
          <p>Questions you answer correctly won't appear again in future quizzes!</p>
        </div>

        <div className="quiz-actions">
          <button onClick={handleStartQuiz} className="btn-start-quiz">
            Start New Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

