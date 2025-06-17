import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './styles.css';
import SubjectSelection from './SubjectSelection';
import CreateQuestion from './CreateQuestion';
import Login from './Login';
import Register from './Register';
import StudyLibraries from './StudyLibraries';
import UploadStudyLibrary from './UploadStudyLibrary';
import Welcome from './Welcome';
import Settings from './Settings';
import Study from './Study';
import Progress from './Progress';
import LandingPage from './LandingPage';
import ProtectedRoute from './ProtectedRoute'; // Ensure this matches the file name exactly

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/create-question" element={<CreateQuestion />} />
          <Route path="/upload-study-library" element={<UploadStudyLibrary />} />
          <Route path="/study-libraries" element={<StudyLibraries />} />
          <Route path="/select-subject" element={<SubjectSelection />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/study" element={<Study />} />
          <Route path="/progress" element={<Progress />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;