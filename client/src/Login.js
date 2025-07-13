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
          },
          withCredentials: true,
        }
      );

      const { token } = response.data;
      localStorage.setItem('token', token);
      navigate('/select-subject');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      console.error('Login error:', err);
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${silhouetteImage})` }}>
      <Header />
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="auth-input"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              autoComplete="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="auth-input"
            />
          </div>
          <button type="submit" className="welcome-button">Login</button>
          {error && <p className="error">{error}</p>}
          <p>
            Don't have an account? <Link to="/register" className="link">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
