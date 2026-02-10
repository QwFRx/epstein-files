import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Внутри src/api.js
export const authApi = {
    login: (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        return api.post('/auth/login', formData);
    },
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'), // Добавьте это!
};

export const menuApi = {
    getMenu: (meal_type) => api.get(`/menu/?meal_type=${meal_type || ''}`),
    // Добавление блюда (Повар/Админ)
    addMenuItem: (data) => api.post('/menu/', data),
};

export const orderApi = {
    placeOrder: (menu_item_id) => 
        api.post('/orders/', { 
            menu_item_id, 
            payment_type: 'balance', 
            order_date: new Date().toISOString().split('T')[0] 
        }),
    getMyOrders: (userId) => api.get(`/orders/my?user_id=${userId}`),
    receiveOrder: (orderId) => api.patch(`/orders/${orderId}/receive`),
    // Для повара: получить все заказы (потребуется небольшая доработка бэкенда, 
    // но пока используем имитацию или запрос всех, если бэк позволяет)
    // В данном примере повар будет выдавать заказ по ID.
};

export const reviewApi = {
    createReview: (userId, data) => api.post(`/reviews/?user_id=${userId}`, data),
    getAllReviews: () => api.get('/reviews/all'),
};

export const adminApi = {
    // Инвентарь
    getInventory: () => api.get('/admin/inventory'),
    updateInventory: (itemId, quantity) => api.put(`/admin/inventory/${itemId}?quantity=${quantity}`),
    
    // Закупки
    getRequests: (status) => api.get(`/admin/purchase-requests${status ? `?status=${status}` : ''}`),
    approveRequest: (reqId, adminId) => api.patch(`/admin/purchase-requests/${reqId}/approve?admin_id=${adminId}`),
    
    // Статистика
    getDailyReport: (date) => api.get(`/admin/stats/daily-report?day=${date}`),
    getAttendance: () => api.get('/admin/stats/attendance'),
};

export default api;