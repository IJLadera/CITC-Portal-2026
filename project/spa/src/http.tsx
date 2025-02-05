import axios, {AxiosRequestConfig} from 'axios';
// import { useSelector } from 'react-redux';
// import { RootState } from './store';

const http = axios.create({
    baseURL: 'http://localhost:8000/api/v1/'
});

// http.interceptors.request.use(config => {
//     const token = useSelector((state:RootState) => state.auth.token)
//     if (token !== '') {
//         config.headers.Authorization = `Bearer ${token}`
//     }

//     return config
// })

export default http;