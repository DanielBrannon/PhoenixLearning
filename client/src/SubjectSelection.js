import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

function SubjectSelection() {
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    console.log('Using token for subjects:', token);

    const fetchSubjects = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user-subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Subjects response:', res.data);
        setSubjects(res.data || []);
      } catch (err) {
        console.error('Fetch subjects error:', err.response?.data || err.message);
        setError('Failed to load subjects: ' + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjects();
  }, [navigate]);

  const handleSubjectSelect = (subject) => {
    navigate('/study', { state: { selectedSubject: subject } });
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subject}"? This will remove all associated questions.`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${BASE_URL}/delete-subject`, { subject }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(subjects.filter(s => s !== subject));
    } catch (err) {
      setError('Failed to delete subject: ' + (err.response?.data?.error || err.message));
      console.error('Delete subject error:', err);
    }
  };

  return (
    <div className="subject-selection-container">
      <Header />
      <h2>Select a Subject to Study</h2>
      {error && <p className="error">{error}</p>}
      {isLoading ? (
        <p>Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <div className="empty-state">
          <p>No subjects available yet.</p>
          <p>
            <Link to="/create-question" className="welcome-button">Create a New Question</Link> or{' '}
            <Link to="/study-libraries" className="welcome-button">Load a Study Library</Link> to get started.
          </p>
        </div>
      ) : (
        <div className="subject-cards">
          {subjects.map(subject => (
            <div
              key={subject}
              className="subject-card"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}
            >
              <div>
                <h3>{subject}</h3>
                <p>Study {subject} questions</p>
              </div>
              <button
                onClick={() => handleSubjectSelect(subject)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#ffa500',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Study
              </button>
              <button
                onClick={() => handleDeleteSubject(subject)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#ff4500',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="nav-links">
        <Link to="/welcome">Back to Welcome</Link>
      </div>
    </div>
  );
}

export default SubjectSelection;