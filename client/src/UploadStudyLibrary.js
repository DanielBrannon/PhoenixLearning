import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function UploadStudyLibrary() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [libraryName, setLibraryName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UploadStudyLibrary mounted');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/questions/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Full API response:', res);
        console.log('Response data:', res.data);
        const fetchedQuestions = Array.isArray(res?.data?.questions) ? res.data.questions : [];
        setQuestions(fetchedQuestions);
        if (fetchedQuestions.length === 0 && !res.data.error) {
          setError('No questions found. Create some first!');
        }
      } catch (err) {
        console.error('Fetch questions error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError('Failed to load questions: ' + (err.response?.data?.error || err.message));
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();

    return () => {
      console.log('UploadStudyLibrary unmounted');
    };
  }, [navigate]);

  useEffect(() => {
    console.log('State updated - questions:', questions, 'error:', error, 'loading:', loading);
  }, [questions, error, loading]);

  const handleQuestionToggle = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
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
      await axios.post(`${BASE_URL}/upload-study-library`, {
        name: libraryName,
        question_ids: selectedQuestions
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Library uploaded successfully');
      navigate('/select-subject');
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
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
          <div>
            <label>Library Name:</label>
            <input
              type="text"
              value={libraryName}
              onChange={(e) => setLibraryName(e.target.value)}
              required
            />
          </div>
          <div>
            <h3>Select Questions to Include:</h3>
            {questions.length === 0 && !error ? (
              <p>No questions available. Create some first!</p>
            ) : (
              questions.length > 0 && (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {questions.map(question => (
                    <li key={question.id} style={{ margin: '10px 0' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => handleQuestionToggle(question.id)}
                        />
                        {question.text} (Subject: {question.topic})
                      </label>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
          <button type="submit" disabled={loading}>Upload Library</button>
        </form>
        <p>
          <a href="/select-subject" style={{ color: '#ff4500' }}>Back to Subject Selection</a>
        </p>
      </div>
    </div>
  );
}

export default UploadStudyLibrary;