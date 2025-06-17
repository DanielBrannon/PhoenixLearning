import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import glowImage from './assets/phoenix-rebirth-silhouette.png'; // Import glowImage
import Header from './Header'; // Import Head
const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';// er

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Registering with:', { email, password });
    try {
      await axios.post(`${BASE_URL}/register`, { email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div
      className="auth-container"
      style={{
        backgroundImage: `url(${glowImage})`
      }}
    >
      <Header />
      <div className="auth-card">
        <h2>Register</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleRegister}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;