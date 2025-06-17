import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function ReviewTest({ questions, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no questions, complete immediately with empty results
    if (!questions || questions.length === 0) {
      onComplete([]);
    }
  }, [questions, onComplete]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    setResults(prev => [...prev, { question_id: currentQuestion.id, correct: isCorrect }]);

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${BASE_URL}/progress`, {
        question_id: currentQuestion.id,
        correct: isCorrect
      }, {
        headers: { Authorization: token }
      });
    } catch (err) {
      setError('Failed to save progress: ' + err.message);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
    } else {
      onComplete(results);
    }
  };

  if (!currentQuestion) return <div>No questions to review.</div>;

  return (
    <div className="review-test-container">
      <Header />
      <div className="review-test-card">
        <h2>Review Test</h2>
        {error && <p className="error">{error}</p>}
        <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
        <form onSubmit={handleSubmit}>
          <label>{currentQuestion.text}</label>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            required
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}

export default ReviewTest;