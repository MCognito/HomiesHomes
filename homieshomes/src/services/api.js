import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',  // Update this URL with your backend's URL
});

export default api;
