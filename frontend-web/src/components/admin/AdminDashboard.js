import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('questionsFile', file);

      const response = await api.post('/admin/upload-questions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      setFile(null);
      document.getElementById('fileInput').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(', '));
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            User Dashboard
          </button>
          <button onClick={logout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="upload-section">
          <h2>Upload Questions</h2>
          <p className="upload-info">
            Upload questions using CSV or XLSX format. 
            <a href="/sample-questions.csv" download className="download-link"> Download sample CSV</a>
          </p>

          <form onSubmit={handleUpload} className="upload-form">
            <div className="file-input-wrapper">
              <input
                id="fileInput"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="fileInput" className="file-label">
                Choose File
              </label>
              {file && <span className="file-name">{file.name}</span>}
            </div>

            <button 
              type="submit" 
              disabled={!file || uploading}
              className="upload-btn"
            >
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </button>
          </form>

          {error && <div className="error-message">{error}</div>}
          
          {uploadResult && (
            <div className="success-message">
              <p>✓ Successfully uploaded {uploadResult.count} questions!</p>
            </div>
          )}
        </div>

        <div className="format-info">
          <h3>CSV Format</h3>
          <p>Your CSV file should have the following columns:</p>
          <ul>
            <li><strong>Question Text</strong> - The question text</li>
            <li><strong>Question Type</strong> - "objective" or "fill_blank"</li>
            <li><strong>Options</strong> - For objective questions: "A: Option1, B: Option2, C: Option3, D: Option4"</li>
            <li><strong>Correct Answer</strong> - The correct answer (letter for objective, text for fill_blank)</li>
            <li><strong>Complexity Level</strong> - "easy", "moderate", or "complex"</li>
            <li><strong>Subject</strong> - The subject/category of the question (optional)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

