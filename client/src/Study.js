import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import ReviewTest from './ReviewTest';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';

function Study() {
  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [reviewInterval, setReviewInterval] = useState(10);
  const [questionsBeforeAnswer, setQuestionsBeforeAnswer] = useState(5);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResults, setReviewResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [choiceFeedback, setChoiceFeedback] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSubject = location.state?.selectedSubject || 'all';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    axios.get(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setReviewInterval(res.data.review_interval || 10);
        setQuestionsBeforeAnswer(res.data.questions_before_answer || 5);
      })
      .catch(err => console.error('Error fetching settings:', err))
      .finally(() => fetchInitialQuestions());
  }, [selectedSubject, navigate]);

  const fetchInitialQuestions = async () => {
    setQuestionsQueue([]);
    setCurrentIndex(0);
    setStep(0);
    setError(null);

    const token = localStorage.getItem('token');
    const endpoint = selectedSubject === 'all'
      ? 'questions/random'
      : `questions/random/${encodeURIComponent(selectedSubject)}`;
    const fullUrl = `${BASE_URL}/${endpoint}?count=${questionsBeforeAnswer}`; // Add count parameter

    try {
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const questions = response.data.questions || [response.data]; // Handle single or array response
      if (questions.length === 0) {
        setError(`No questions available for subject: ${selectedSubject}`);
        return;
      }
      setQuestionsQueue(questions);
    } catch (err) {
      setError('Failed to load questions: ' + (err.response?.data?.error || err.message));
      console.error('Fetch initial questions error:', err);
    }
  };

  const handleNextStep = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (currentIndex + 1 < questionsQueue.length) {
        setCurrentIndex(prev => prev + 1);
        setStep(0);
        setSelectedChoice(null);
        setChoiceFeedback(null);
      } else {
        setStep(2);
      }
    }
  };

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    if (choice === currentQuestion.answer) {
      setChoiceFeedback('Correct!');
    } else {
      setChoiceFeedback(`Incorrect. The correct answer is: ${currentQuestion.answer}`);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm(`Are you sure you want to delete question ${questionId}?`)) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${BASE_URL}/delete-question/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestionsQueue(questionsQueue.filter(q => q.id !== questionId));
      if (currentIndex >= questionsQueue.length - 1) {
        setCurrentIndex(0);
        setStep(0);
      }
    } catch (err) {
      setError('Failed to delete question: ' + (err.response?.data?.error || err.message));
      console.error('Delete question error:', err);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const batchResults = {};

    const progressPromises = questionsQueue.map(async (question) => {
      const userAnswer = userAnswers[question.id] || '';
      const isCorrect = userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
      batchResults[question.id] = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.answer}`;

      try {
        await axios.post(`${BASE_URL}/progress`, {
          question_id: question.id,
          correct: isCorrect
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Error saving progress for question', question.id, ':', err.message);
      }
    });

    await Promise.all(progressPromises);

    setResults(batchResults);
    setSessionQuestions(prev => [...prev, ...questionsQueue]);

    const totalReviewed = sessionQuestions.length + questionsQueue.length;
    if (totalReviewed >= reviewInterval) {
      setIsReviewing(true);
    } else {
      setTimeout(() => {
        setQuestionsQueue([]);
        setCurrentIndex(0);
        setStep(0);
        setUserAnswers({});
        setResults(null);
        setSelectedChoice(null);
        setChoiceFeedback(null);
        fetchInitialQuestions();
      }, 500);
    }
  };

  const handleNextBatch = () => {
    setQuestionsQueue([]);
    setCurrentIndex(0);
    setStep(0);
    setUserAnswers({});
    setResults(null);
    setSelectedChoice(null);
    setChoiceFeedback(null);
    fetchInitialQuestions();
  };

  const handleReviewComplete = (results) => {
    setReviewResults(results);
    setIsReviewing(false);
    setSessionQuestions([]);
  };

  if (error) return <div className="error">{error}</div>;
  if (!questionsQueue.length && !isReviewing && !reviewResults) return <div>Loading...</div>;

  const currentQuestion = questionsQueue[currentIndex];

  if (reviewResults) {
    return (
      <div className="review-results-container">
        <Header />
        <h2>Review Test Results</h2>
        <p>
          You got {reviewResults.filter(r => r.correct).length} out of {reviewResults.length} correct!
        </p>
        <button onClick={() => { setReviewResults(null); handleNextBatch(); }}>
          Continue Studying
        </button>
      </div>
    );
  }

  if (isReviewing) {
    return <ReviewTest questions={sessionQuestions} onComplete={handleReviewComplete} />;
  }

  if (step === 2) {
    return (
      <div className="study-container">
        <Header />
        <div className="study-card">
          <h1 className="step-2">Answer the Questions</h1>
          <form onSubmit={handleBatchSubmit}>
            {questionsQueue.map((q, index) => (
              <div key={q.id} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <label>Question {index + 1}: {q.text}</label>
                  <input
                    type="text"
                    value={userAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    required
                  />
                  {results && results[q.id] && (
                    <p className={results[q.id].includes('Correct') ? 'result-correct' : 'result-incorrect'}>
                      {results[q.id]}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#ff4500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            {!results && <button type="submit">Submit All Answers</button>}
            {results && <button onClick={handleNextBatch}>Next Batch</button>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="study-container">
      <Header />
      {step === 0 && (
        <div className="study-card">
          <h1 className="step-0">{currentQuestion.text}</h1>
          {(currentQuestion.choice1 || currentQuestion.choice2 || currentQuestion.choice3 || currentQuestion.answer) && (
            <div>
              <p>Select the correct answer:</p>
              <div style={{ margin: '10px 0' }}>
                {/* Combine and randomize the four options: answer, choice1, choice2, choice3 */}
                {[...[currentQuestion.answer, currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3]]
                  .filter((choice, index, self) => choice && self.indexOf(choice) === index) // Remove duplicates
                  .sort(() => Math.random() - 0.5) // Randomize order
                  .map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleChoiceSelect(choice)}
                      style={{
                        padding: '10px',
                        margin: '5px',
                        backgroundColor: selectedChoice === choice ? (choice === currentQuestion.answer ? '#4caf50' : '#f44336') : '#ffa500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                      disabled={selectedChoice !== null}
                    >
                      {choice}
                    </button>
                  ))}
              </div>
              {choiceFeedback && <p style={{ color: choiceFeedback.includes('Correct') ? 'green' : 'red' }}>{choiceFeedback}</p>}
            </div>
          )}
          {!currentQuestion.choice1 && !currentQuestion.choice2 && !currentQuestion.choice3 && !currentQuestion.answer && (
            <p><strong>Answer:</strong> {currentQuestion.answer}</p>
          )}
          <button onClick={handleNextStep} disabled={(currentQuestion.choice1 || currentQuestion.choice2 || currentQuestion.choice3 || currentQuestion.answer) && !selectedChoice}>
            Next
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="study-card">
          <h1 className="step-1">Information</h1>
          <p>{currentQuestion.content}</p>
          {currentQuestion.image_url && (
            <div>
              <img
                src={currentQuestion.image_url}
                alt="Question Information"
                style={{ maxWidth: '100%', marginTop: '10px' }}
                onError={(e) => {
                  console.error('Image load error:', e);
                  // Fallback message
                  return <p>Image unavailable (stored in temporary location).</p>;
                }}
              />
            </div>
          )}
          <button className="step-1" onClick={handleNextStep}>Next</button>
        </div>
      )}
    </div>
  );
}

export default Study;