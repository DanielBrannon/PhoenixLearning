import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';
function Progress() {
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${BASE_URL}/progress`, {
      headers: { Authorization: token }
    })
      .then(res => setProgress(res.data))
      .catch(err => setError('Failed to load progress: ' + err.message));
  }, []);
  return (
    <div className="progress-container">
      <Header />
      <div className="progress-card">
        {error ? (
          <p className="error">{error}</p>
        ) : progress.length === 0 ? (
          <div className="empty-state">
            <p>No progress to show.</p>
            <p>
              Start studying to track your progress! Go to{' '}
              <Link to="/select-subject" className="welcome-button">Subject Selection</Link> to begin.
            </p>
          </div>
        ) : (
          <>
            <h2>Your Progress</h2>
            <ul>
              {progress.map(p => (
                <li key={p.question_id}>
                  Question {p.question_id}: {p.correct ? 'Correct' : 'Incorrect'} - Last Reviewed: {p.last_reviewed}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
export default Progress;