import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

function CreateQuestion() {
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [choice1, setChoice1] = useState('');
  const [choice2, setChoice2] = useState('');
  const [choice3, setChoice3] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    fetchSubjects();
  }, [navigate]);

  const fetchSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/user-subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedSubjects = response.data || [];
      if (!fetchedSubjects.includes('Custom')) {
        fetchedSubjects.push('Custom');
      }
      setSubjects(fetchedSubjects);
    } catch (err) {
      setError('Failed to load subjects: ' + (err.response?.data?.error || err.message));
      console.error('Fetch subjects error:', err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    setShowCustomInput(topic.toLowerCase() === 'custom');
  }, [topic]);

  const handleSubjectChange = (e) => {
    setTopic(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const finalTopic = topic.toLowerCase() === 'custom' ? customTopic : topic;
    const data = {
      text,
      answer,
      choice1,
      choice2,
      choice3,
      content,
      topic: finalTopic,
    };

    console.log('Sending request to:', `${BASE_URL}/create-question`, 'with headers:', {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }, 'and data:', data);

    try {
      const response = await axios.post(`${BASE_URL}/create-question`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 10000,
      });
      setText('');
      setAnswer('');
      setChoice1('');
      setChoice2('');
      setChoice3('');
      setContent('');
      setTopic('');
      setCustomTopic('');
      await fetchSubjects(); // Refresh subjects after success
    } catch (err) {
      setError('Failed to create question: ' + (err.response?.data?.error || err.message || 'Network Error'));
      console.error('Create question error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
    } finally {
      setLoading(false);
    }
  };

  if (subjectsLoading) {
    return (
      <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
        <Header />
        <div className="auth-card">
          <h2>Loading Subjects...</h2>
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
        <h2>Create a New Question</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Question:</label>
            <input type="text" name="text" value={text} onChange={(e) => setText(e.target.value)} required />
          </div>
          <div>
            <label>Answer:</label>
            <input type="text" name="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </div>
          <div>
            <label>Wrong Choice 1:</label>
            <input type="text" name="choice1" value={choice1} onChange={(e) => setChoice1(e.target.value)} required />
          </div>
          <div>
            <label>Wrong Choice 2:</label>
            <input type="text" name="choice2" value={choice2} onChange={(e) => setChoice2(e.target.value)} required />
          </div>
          <div>
            <label>Wrong Choice 3:</label>
            <input type="text" name="choice3" value={choice3} onChange={(e) => setChoice3(e.target.value)} required />
          </div>
          <div>
            <label>Useful Info (optional):</label>
            <textarea name="content" value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '80%', height: '100px', padding: '10px' }} />
          </div>
          <div>
            <label>Subject:</label>
            <select name="topic" value={topic} onChange={handleSubjectChange} required>
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          {showCustomInput && (
            <div>
              <label>Custom Subject:</label>
              <input
                type="text"
                name="customTopic"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Enter a new subject"
                required
              />
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Question'}
          </button>
        </form>
        <p>
          <a href="/select-subject">Back to Subject Selection</a>
        </p>
      </div>
    </div>
  );
}

export default CreateQuestion;