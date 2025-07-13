import { useState, useEffect, useRef } from 'react';
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
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const navigate = useNavigate();
  const formRef = useRef(null);
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
      const fetchedSubjects = Array.isArray(response.data) ? response.data.map(item => item.subject) : [];
      if (!fetchedSubjects.includes('Custom')) {
        fetchedSubjects.push('Custom');
      }
      setSubjects(fetchedSubjects);
    } catch (err) {
      console.error('Fetch subjects error:', err.response?.data || err.message);
      setError('Failed to load subjects: ' + (err.response?.data?.error || err.message));
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

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setImageUrl('');
  };

const uploadImageToS3 = async () => {
  if (!image) return '';
  console.log('Starting image upload:', image.name, image.type);
  try {
    const token = localStorage.getItem('token');
    const presignResponse = await axios.get(`${BASE_URL}/api/presigned-url`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { filename: image.name, contentType: image.type },
    });
    console.log('Presigned URL response:', presignResponse.data);
    const { url, fields, bucket_name, aws_region, file_path } = presignResponse.data;

    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
      console.log(`Appending field: ${key}=${value}`);
    });
    formData.append('file', image);
    console.log('Uploading to:', url);
    console.log('FormData entries:', Array.from(formData.entries()));

    const fetchResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const result = await fetchResponse.text();
    console.log('Fetch upload response:', fetchResponse.status, result);
    if (!fetchResponse.ok) throw new Error('Upload failed with fetch: ' + result);

    const fullImageUrl = `https://${bucket_name}.s3.${aws_region}.amazonaws.com/${file_path}`;
    console.log('Constructed image URL:', fullImageUrl);

    // Enhanced verification with timeout and error handling
    const verifyResponse = await fetch(fullImageUrl, {
      method: 'HEAD',
      timeout: 5000, // 5-second timeout
    }).catch(err => {
      console.error('Verification fetch error:', err.message, 'URL:', fullImageUrl);
      throw new Error('Verification failed: ' + err.message);
    });
    console.log('Verification response:', verifyResponse.status, verifyResponse.statusText);
    if (!verifyResponse.ok) throw new Error('Uploaded image is not accessible: ' + verifyResponse.statusText);
    return fullImageUrl;
  } catch (err) {
    console.error('Image upload error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      config: err.config,
      url: err.config?.url,
    });
    throw new Error('Failed to upload image: ' + (err.response?.data?.error || err.message || (err.code === 'ECONNABORTED' ? 'Request timed out' : 'Unknown error')));
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!formRef.current) {
      setError('Form not found in the DOM');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const finalTopic = topic.toLowerCase() === 'custom' ? customTopic : topic;
    if (!finalTopic) {
      setError('Please select or enter a subject');
      setLoading(false);
      return;
    }

    let uploadedImageUrl = imageUrl;
    if (image && !imageUrl) {
      try {
        uploadedImageUrl = await uploadImageToS3();
        console.log('Uploaded image URL:', uploadedImageUrl);
      } catch (uploadErr) {
        setError(uploadErr.message);
        setLoading(false);
        return;
      }
    }

    const data = {
      text,
      answer,
      choice1,
      choice2,
      choice3,
      content,
      topic: finalTopic,
      image_url: uploadedImageUrl || undefined,
    };

    console.log('Sending request to:', `${BASE_URL}/create-question`, 'with data:', data);

    try {
      const response = await axios.post(`${BASE_URL}/create-question`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      console.log('Create question response:', response.data);
      setTimeout(() => {
        setText('');
        setAnswer('');
        setChoice1('');
        setChoice2('');
        setChoice3('');
        setContent('');
        setTopic('');
        setCustomTopic('');
        setImage(null);
        setImageUrl('');
        fetchSubjects();
      }, 0);
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

  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url(${silhouetteImage})`, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <Header />
      <div className="auth-card">
        <h2>Create a New Question</h2>
        {subjectsLoading ? (
          <h2>Loading Subjects...</h2>
        ) : error ? (
          <div>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => setError(null)}>Retry</button>
          </div>
        ) : !Array.isArray(subjects) || subjects.length === 0 ? (
          <p>No subjects available. Please add a subject or try again.</p>
        ) : (
          <form id="create-question-form" ref={formRef} onSubmit={handleSubmit}>
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
              <textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '80%', height: '100px', padding: '10px' }}
              />
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
            <div>
              <label htmlFor="image-upload">Image (optional):</label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imageUrl && <p>Image uploaded: <a href={imageUrl} target="_blank" rel="noopener noreferrer">View</a></p>}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Question'}
            </button>
          </form>
        )}
        <p>
          <a href="/select-subject">Back to Subject Selection</a>
        </p>
      </div>
    </div>
  );
}

export default CreateQuestion;
