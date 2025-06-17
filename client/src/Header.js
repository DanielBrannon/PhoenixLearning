import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import phoenixLogo from './assets/phoenix-logo-watercolor.png';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log('Header.js: Token found:', storedToken); // Debug: Log token
    setToken(storedToken);
  }, []);

  const handleLogout = () => {
    console.log('Header.js: Logging out, clearing token');
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="main-header" role="banner">
      <div className="header-content">
        <div className="header-brand">
          <Link to={token ? "/welcome" : "/"} className="brand-link">
            <img src={phoenixLogo} alt="Phoenix Learning Logo" className="header-logo" />
            <span className="header-title">Phoenix Learning</span>
          </Link>
        </div>
        <button
          className="menu-toggle"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span className="menu-icon"></span>
        </button>
        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`} aria-label="Main navigation">
          {token && (
            <>
              <Link to="/select-subject">Subjects</Link>
              <Link to="/create-question">Create</Link>
              <Link to="/study-libraries">Libraries</Link>
              <Link to="/upload-study-library">Upload</Link>
              <Link to="/progress">Progress</Link>
              <Link to="/settings">Settings</Link>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;