import { Link } from 'react-router-dom';
import silhouetteImage from './assets/phoenix-rebirth-silhouette.png'; // Reuse existing image

function LandingPage() {
  return (
    <div className="landing-container">
      <div className="hero-section" style={{ backgroundImage: `url(${silhouetteImage})` }}>
        <div className="hero-content">
          <h1>Welcome to Phoenix Learning</h1>
          <p>Master your studies with personalized questions and study libraries.</p>
          <div className="hero-buttons">
            <Link to="/login" className="welcome-button">Continue Studying Here</Link>
            <Link to="/register" className="welcome-button secondary">Sign Up</Link>
          </div>
        </div>
      </div>
      <div className="features-section">
        <h2>Why Choose Phoenix Learning?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Create Questions</h3>
            <p>Build custom questions tailored to your learning needs, with support for multiple-choice and more.</p>
          </div>
          <div className="feature-card">
            <h3>Study Libraries</h3>
            <p>Organize your study materials into shareable libraries for efficient learning.</p>
          </div>
          <div className="feature-card">
            <h3>Spaced Repetition</h3>
            <p>Learn smarter with our spaced repetition algorithm to maximize retention.</p>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; 2025 Phoenix Learning. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;