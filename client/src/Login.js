import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png';
import Header from './Header';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        `${BASE_URL}/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            // Add any custom headers if required by your backend
          },
          withCredentials: true, // Set to true if your backend uses cookies/session
        }
      );

      const { token } = response.data;
      localStorage.setItem('token', token); // Store token in localStorage
      navigate('/select-subject'); // Redirect to subject selection on success
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      console.error('Login error:', err); // Log the full error for debugging
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
      <Header />
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" className="welcome-button">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
        <p>
          Don't have an account? <Link to="/register" className="link">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;