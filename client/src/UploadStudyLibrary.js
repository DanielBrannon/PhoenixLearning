import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

const BASE_URL = 'https://phoenix-learning-backend.herokuapp.com'; // Updated to match your clarification

function UploadStudyLibrary() {
  const [libraryName, setLibraryName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const [questionsRes, librariesRes] = await Promise.all([
          axios.get(`${BASE_URL}/questions/all`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/study-libraries`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setQuestions(Array.isArray(questionsRes?.data?.questions) ? questionsRes.data.questions : []);
        setLibraries(Array.isArray(librariesRes?.data) ? librariesRes.data : []);
      } catch (err) {
        console.error('Fetch data error:', err);
        setError('Failed to load data: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleQuestionToggle = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleDeleteLibrary = async (libraryId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${BASE_URL}/delete-study-library/${libraryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLibraries((prev) => prev.filter((lib) => lib.id !== libraryId));
    } catch (err) {
      setError('Failed to delete library: ' + err.message);
    }
  };

  const handleLoadLibrary = async (libraryId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${BASE_URL}/load-study-library/${libraryId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Library loaded:', response.data);
      // Navigate to study page or refresh subjects (adjust based on your app flow)
      navigate('/select-subject'); // Or /study with library context
    } catch (err) {
      setError('Failed to load library: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!libraryName) {
      setError('Library name is required');
      return;
    }
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BASE_URL}/upload-study-library`,
        { name: libraryName, question_ids: selectedQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLibraryName('');
      setSelectedQuestions([]);
      navigate('/select-subject');
    } catch (err) {
      setError('Failed to upload library: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
        <Header />
        <div className="auth-card">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
      <Header />
      <div className="auth-card">
        <h2>Upload Study Library</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="card">
            <label>Library Name:</label>
            <input
              type="text"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              required
            />
          </div>
          <h3>Existing Libraries:</h3>
          {libraries.length > 0 ? (
            <div className="library-cards">
              {libraries.map((library) => (
                <div key={library.id} className="card">
                  <span>{library.name} ({library.question_count || 0} questions)</span>
                  <button onClick={() => handleLoadLibrary(library.id)}>Load</button>
                  <button
                    onClick={() => handleDeleteLibrary(library.id)}
                    style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No libraries found.</p>
          )}
          <h3>Select Questions to Include:</h3>
          {questions.length === 0 ? (
            <p>No questions available. Create some first!</p>
          ) : (
            <div className="question-cards">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`card ${selectedQuestions.includes(question.id) ? 'selected' : ''}`}
                  onClick={() => handleQuestionToggle(question.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.id)}
                    onChange={() => handleQuestionToggle(question.id)}
                    style={{ marginRight: '10px' }}
                  />
                  <span>{question.text} (Subject: {question.topic})</span>
                </div>
              ))}
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Library'}
          </button>
        </form>
        <p>
          <a href="/select-subject" style={{ color: '#ff4500' }}>Back to Subject Selection</a>
        </p>
      </div>
    </div>
  );
}

export default UploadStudyLibrary;