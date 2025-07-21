import axios from 'axios';
import store from './store';
// import { useSelector } from 'react-redux';
// import { RootState } from './store';

const http = axios.create({
  baseURL: process.env.NODE_ENV == 'development' ? 'http://127.0.0.1:8000/api/v1/' : 'https://citc-ustpcdo.com/api/v1/'
});
http.defaults.xsrfHeaderName = "X-CSRFTOKEN";
http.defaults.xsrfCookieName = "csrftoken";


http.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default http;
