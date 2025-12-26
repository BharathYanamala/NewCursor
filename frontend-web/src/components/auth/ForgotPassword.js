import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail });
      setSuccess(response.data.message);
      
      // In development, show the reset token if provided
      if (response.data.resetLink) {
        setSuccess(
          <div>
            <p>{response.data.message}</p>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              <strong>Development Mode:</strong> Reset link: 
              <a href={response.data.resetLink} style={{ color: '#667eea', marginLeft: '5px' }}>
                {response.data.resetLink}
              </a>
            </p>
          </div>
        );
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send password reset email');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div style={{ 
            background: '#e8f5e9', 
            color: '#2e7d32', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            border: '1px solid #c8e6c9'
          }}>
            {success}
          </div>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="auth-link">
          Remember your password? <Link to="/login">Login here</Link>
        </p>
        <p className="auth-link" style={{ marginTop: '10px' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

