import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function Settings() {
  const [interval, setInterval] = useState(10);
  const [questionsBeforeAnswer, setQuestionsBeforeAnswer] = useState(5);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `${BASE_URL}/settings`,
        {
          review_interval: parseInt(interval),
          questions_before_answer: parseInt(questionsBeforeAnswer)
        },
        {
          headers: { Authorization: token }
        }
      );
      navigate('/select-subject');
    } catch (err) {
      setError('Failed to save settings: ' + err.message);
    }
  };

  return (
    <div
      className="settings-container"
      style={{
        backgroundImage: `url(${silhouetteImage})`
      }}
    >
      <Header />
      <div className="settings-card">
        <h2>Settings</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Review Interval (10, 20, or 50 questions):</label>
          <select value={interval} onChange={(e) => setInterval(e.target.value)}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <label>Questions Before Answering (3, 5, or 10):</label>
          <select value={questionsBeforeAnswer} onChange={(e) => setQuestionsBeforeAnswer(e.target.value)}>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
          <button type="submit">Save</button>
        </form>
        <a href="/select-subject">Back to Subject Selection</a>
      </div>
    </div>
  );
}

export default Settings;