import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import Header from './Header'; // Add Header for consistency with Login.js

function Welcome() {
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await axios.get('/'); // Calls backend `/` route
        console.log('Welcome auth verification:', res.data); // Debug: Expect "Welcome to Phoenix Learning!"
      } catch (err) {
        console.error('Welcome auth failed:', err.response?.data || err.message);
        // 401 handling is in axiosConfig.js (redirects to /login)
      }
    };
    verifyAuth();
  }, []);

  return (
    <div className="auth-container">
      <Header />
      <div className="auth-card">
        <h2>Welcome to Phoenix Learning</h2>
        <p>Get started by creating or loading study materials:</p>
        <div className="welcome-options">
          <Link to="/create-question" className="welcome-button">Create New Question</Link>
          <Link to="/upload-study-library" className="welcome-button">Upload Study Library</Link>
          <Link to="/study-libraries" className="welcome-button">Load Study Library</Link>
          <Link to="/select-subject" className="welcome-button secondary">View Subjects</Link>
        </div>
      </div>
    </div>
  );
}

export default Welcome;