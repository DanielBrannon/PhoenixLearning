import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function StudyLibraries() {
  const [libraries, setLibraries] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchLibraries = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/study-libraries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLibraries(res.data || []);
      } catch (err) {
        setError('Failed to load libraries: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchLibraries();
  }, [navigate]);

  const handleLoadLibrary = async (libraryId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/load-study-library/${libraryId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/select-subject');
    } catch (err) {
      setError('Failed to load library: ' + (err.response?.data?.error || err.message));
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
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
      <Header />
      <div className="auth-card">
        <h2>Study Libraries</h2>
        {libraries.length === 0 ? (
          <p>No libraries available.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {libraries.map(library => (
              <li key={library.id} style={{ margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{library.name} ({library.question_count} questions)</span>
                  <button
                    onClick={() => handleLoadLibrary(library.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#ffa500',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Load
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p>
          <a href="/select-subject" style={{ color: '#ff4500' }}>Back to Subject Selection</a>
        </p>
      </div>
    </div>
  );
}


export default StudyLibraries;

