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

    const fetchSubjectsAndLibraries = async () => {
      try {
        const [subjectsRes, librariesRes] = await Promise.all([
          axios.get(`${BASE_URL}/user-subjects`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
          axios.get(`${BASE_URL}/study-libraries`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }),
        ]);
        console.log('Raw subjects response:', subjectsRes.data);
        console.log('Raw libraries response:', librariesRes.data);
        const subjectsData = Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data?.data || [];
        const librariesData = Array.isArray(librariesRes.data) ? librariesRes.data : librariesRes.data?.data || [];

        // Deduplicate and combine, ensuring unique subjects
        const uniqueSubjects = new Map();
        subjectsData.forEach(s => uniqueSubjects.set(s, { subject: s, question_count: 0, type: 'subject' }));
        librariesData.forEach(lib => uniqueSubjects.set(lib.name || lib.library_name, {
          id: lib.id || lib.library_id,
          subject: lib.name || lib.library_name,
          question_count: lib.question_count || 0,
          type: 'library',
        }));
        const allSubjects = Array.from(uniqueSubjects.values());
        console.log('Combined subjects:', allSubjects);
        setSubjects(allSubjects);
      } catch (err) {
        console.error('Fetch error details:', err.response?.data || err.message, err.config);
        setError('Failed to load subjects or libraries: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjectsAndLibraries();
  }, [navigate]);

  const handleSubjectSelect = (subject) => {
    navigate('/study', { state: { selectedSubject: subject.subject, type: subject.type, id: subject.id } });
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subject.subject}"? This will remove all associated questions.`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${BASE_URL}/delete-subject`, { subject: subject.subject }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setSubjects(subjects.filter((s) => s.subject !== subject.subject));
    } catch (err) {
      console.error('Delete subject error:', err.response?.data || err.message, err.config);
      setError('Failed to delete subject: ' + (err.response?.data?.error || err.message));
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
          {subjects.map((subject) => (
            <div
              key={subject.id || subject.subject}
              className="subject-card"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}
            >
              <div>
                <h3>{subject.subject} {subject.type === 'library' ? '(Library)' : ''}</h3>
                <p>Study {subject.question_count} questions</p>
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
                  marginRight: '10px',
                }}
              >
                Study
              </button>
              {subject.type === 'subject' && (
                <button
                  onClick={() => handleDeleteSubject(subject)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ff4500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              )}
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