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
    console.log('Using token for subjects and libraries:', token);

    const fetchSubjectsAndLibraries = async () => {
      try {
        const [subjectsRes, librariesRes] = await Promise.all([
          axios.get(`${BASE_URL}/user-subjects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/study-libraries`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        console.log('Raw subjects response:', subjectsRes.data);
        console.log('Raw libraries response:', librariesRes.data);

        // Ensure subjectsData is always an array, handling potential null or object responses
        const subjectsData = Array.isArray(subjectsRes.data) ? subjectsRes.data :
          (subjectsRes.data?.data && Array.isArray(subjectsRes.data.data)) ? subjectsRes.data.data : [];
        const librariesData = Array.isArray(librariesRes.data) ? librariesRes.data :
          (librariesRes.data?.data && Array.isArray(librariesRes.data.data)) ? librariesRes.data.data : [];

        // Deduplicate and combine, ensuring unique subjects with proper structure
        const uniqueSubjects = new Map();
        subjectsData.forEach(s => {
          if (s && s.subject) {
            uniqueSubjects.set(s.subject, {
              subject: s.subject,
              question_count: s.question_count || 0,
              type: 'subject'
            });
          }
        });
        librariesData.forEach(lib => {
          if (lib && (lib.name || lib.library_name)) {
            uniqueSubjects.set(lib.name || lib.library_name, {
              id: lib.id || lib.library_id,
              subject: lib.name || lib.library_name,
              question_count: lib.question_count || 0,
              type: 'library',
            });
          }
        });
        const allSubjects = Array.from(uniqueSubjects.values());
        console.log('Combined subjects with types:', allSubjects);
        setSubjects(allSubjects);
      } catch (err) {
        console.error('Fetch error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          config: err.config,
        });
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
      });
      setSubjects(subjects.filter((s) => s.subject !== subject.subject || s.type !== 'subject'));
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
      ) : !Array.isArray(subjects) || subjects.length === 0 ? (
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
                <p>Questions: {subject.question_count || 0} {subject.type === 'subject' ? '(Editable)' : ''}</p>
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
