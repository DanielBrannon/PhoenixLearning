import axios from 'axios';

const BASE_URL = 'https://phoenix-learning-backend-b4ea6248c81b.herokuapp.com';
axios.defaults.baseURL = BASE_URL;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Ensure Bearer prefix
      console.log('Added Authorization header:', config.headers.Authorization, 'for URL:', config.url);
    } else {
      console.log('No token found for request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Remove the 401 redirect interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 Unauthorized detected for URL:', error.config?.url, 'Response:', error.response?.data);
      // Let components handle 401 errors individually
    }
    return Promise.reject(error);
  }
);

export default axios;