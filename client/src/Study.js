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

    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviewInterval(response.data.review_interval || 10);
        setQuestionsBeforeAnswer(response.data.questions_before_answer || 5);
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        fetchInitialQuestions();
      }
    };

    fetchSettings();
  }, [selectedSubject, navigate]);

  const fetchInitialQuestions = async () => {
    setQuestionsQueue([]);
    setCurrentIndex(0);
    setStep(0);
    setError(null);
    setUserAnswers({});
    setResults(null);
    setSelectedChoice(null);
    setChoiceFeedback(null);

    const token = localStorage.getItem('token');
    const endpoint = selectedSubject === 'all'
      ? 'questions/random'
      : `questions/random/${encodeURIComponent(selectedSubject)}`;
    const fullUrl = `${BASE_URL}/${endpoint}?count=${questionsBeforeAnswer}`;

    try {
      const response = await axios.get(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const questions = Array.isArray(response.data.questions)
        ? response.data.questions
        : [response.data]; // Handle single question or array
      if (questions.length === 0) {
        setError(`No questions available for subject: ${selectedSubject}`);
        return;
      }
      console.log('Fetched questions with image_urls:', questions.map(q => ({ id: q.id, image_url: q.image_url })));
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
      [questionId]: answer,
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
        await axios.post(
          `${BASE_URL}/progress`,
          { question_id: question.id, correct: isCorrect },
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
        fetchInitialQuestions();
      }, 500);
    }
  };

  const handleNextBatch = () => {
    fetchInitialQuestions();
  };

  const handleReviewComplete = (results) => {
    setReviewResults(results);
    setIsReviewing(false);
    setSessionQuestions([]);
    fetchInitialQuestions();
  };

  if (error) {
    return (
      <div className="study-container">
        <Header />
        <div className="error">{error}</div>
        <button onClick={fetchInitialQuestions}>Retry</button>
      </div>
    );
  }
  if (!questionsQueue.length && !isReviewing && !reviewResults) return <div>Loading...</div>;

  const currentQuestion = questionsQueue[currentIndex];

  if (reviewResults) {
    return (
      <div className="study-container">
        <Header />
        <div className="study-card">
          <h2>Review Test Results</h2>
          <p>
            You got {reviewResults.filter(r => r.correct).length} out of {reviewResults.length} correct!
          </p>
          <button onClick={handleNextBatch}>Continue Studying</button>
        </div>
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
          <h1>Answer the Questions</h1>
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
                    marginLeft: '10px',
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
          <h1>{currentQuestion.text}</h1>
          {(currentQuestion.choice1 || currentQuestion.choice2 || currentQuestion.choice3 || currentQuestion.answer) && (
            <div>
              <p>Select the correct answer:</p>
              <div style={{ margin: '10px 0' }}>
                {[...new Set([currentQuestion.answer, currentQuestion.choice1, currentQuestion.choice2, currentQuestion.choice3])]
                  .filter(choice => choice) // Remove null/undefined
                  .sort(() => Math.random() - 0.5)
                  .map((choice, index) => (
                    <button
                      key={index}
                      onClick={() => handleChoiceSelect(choice)}
                      style={{
                        padding: '10px',
                        margin: '5px',
                        backgroundColor: selectedChoice === choice
                          ? choice === currentQuestion.answer ? '#4caf50' : '#f44336'
                          : '#ffa500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
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
          <button
            onClick={handleNextStep}
            disabled={(currentQuestion.choice1 || currentQuestion.choice2 || currentQuestion.choice3 || currentQuestion.answer) && !selectedChoice}
          >
            Next
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="study-card">
          <h1>Information</h1>
          <p>{currentQuestion.content || 'No additional content available.'}</p>
          {currentQuestion.image_url && (
            <div>
              <img
                src={currentQuestion.image_url}
                alt="Question Information"
                style={{ maxWidth: '100%', marginTop: '10px' }}
                onError={(e) => {
                  console.error('Image load error:', e, 'URL:', currentQuestion.image_url);
                  e.target.style.display = 'none'; // Hide broken image
                }}
              />
            </div>
          )}
          <button onClick={handleNextStep}>Next</button>
        </div>
      )}
    </div>
  );
}

export default Study;