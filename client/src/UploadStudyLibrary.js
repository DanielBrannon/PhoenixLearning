import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function UploadStudyLibrary() {
  const [libraryName, setLibraryName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [libraries, setLibraries] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    console.log('Using token for data fetch:', token);

    const fetchData = async () => {
      try {
        const [questionsRes, subjectsRes, librariesRes] = await Promise.all([
          axios.get(`${BASE_URL}/questions/all`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/user-subjects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/study-libraries`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        console.log('Raw questions response:', questionsRes.data);
        console.log('Raw subjects response:', subjectsRes.data);
        console.log('Raw libraries response:', librariesRes.data);
        setQuestions(Array.isArray(questionsRes.data?.questions) ? questionsRes.data.questions : []);
        setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
        setLibraries(Array.isArray(librariesRes.data) ? librariesRes.data : []);
      } catch (err) {
        console.error('Fetch data error:', err.response?.data || err.message, err.config);
        setError('Failed to load data: ' + (err.response?.data?.error || err.message || 'Network error'));
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
      setError('Failed to delete library: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStudyItem = (item, type) => {
    navigate('/study', { state: { selectedSubject: item.subject || item.name, type, id: item.id } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!libraryName.trim()) {
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
      const response = await axios.post(
        `${BASE_URL}/upload-study-library`,
        { name: libraryName.trim(), question_ids: selectedQuestions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Upload response:', response.data);
      setLibraryName('');
      setSelectedQuestions([]);
      setLibraries((prev) => [...prev, response.data]); // Assuming response includes new library
      navigate('/select-subject');
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message, err.config);
      setError('Failed to upload library: ' + (err.response?.data?.error || err.message || 'Network error'));
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

  if (error) {
    return (
      <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
        <Header />
        <div className="auth-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
      <Header />
      <div className="auth-card">
        <h2>Upload Study Library</h2>
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
          <h3>Study Items (Subjects and Libraries):</h3>
          <div className="study-cards">
            {subjects.length > 0 && subjects.map((subject) => (
              <div key={subject.subject} className="card" style={{ marginBottom: '10px' }}>
                <span>{subject.subject} (Subject, {subject.question_count || 0} questions)</span>
                <button
                  onClick={() => handleStudyItem(subject, 'subject')}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ffa500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginLeft: '10px',
                  }}
                >
                  Study
                </button>
              </div>
            ))}
            {libraries.length > 0 && libraries.map((library) => (
              <div key={library.id} className="card" style={{ marginBottom: '10px' }}>
                <span>{library.name} (Library, {library.question_count || 0} questions)</span>
                <button
                  onClick={() => handleStudyItem(library, 'library')}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ffa500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginLeft: '10px',
                  }}
                >
                  Study
                </button>
                <button
                  onClick={() => handleDeleteLibrary(library.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ff4500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginLeft: '10px',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            {subjects.length === 0 && libraries.length === 0 && <p>No subjects or libraries available.</p>}
          </div>
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