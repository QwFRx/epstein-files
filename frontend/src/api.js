import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', // јдрес твоего FastAPI
});

// ѕерехватчик: добавл€ем JWT-токен в каждый запрос
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ѕерехватчик ошибок (если токен протух Ч выкидываем на вход)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;