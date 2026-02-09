import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const userId = localStorage.getItem('user_id'); // Нужно для запросов

        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Если токен валиден, восстанавливаем сессию
                setUser({ username: decoded.sub, role: role, id: userId });
            } catch (e) {
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        const { access_token } = response.data;

        // Декодируем токен (хотя роль лучше получать отдельным запросом /users/me)
        // Для хакатона берем роль с бэка, если она там есть, или определяем "на глаз"
        // ВНИМАНИЕ: Для полноценной работы добавь endpoint GET /auth/me в backend!
        // Пока сделаем упрощенную логику определения роли по логину (для теста):
        let role = "student";
        let id = 2; // Хардкод ID, если бэк не возвращает ID при логине. 
        // ВАЖНО: Исправь backend, чтобы /login возвращал user_id и role

        if (username === "admin") { role = "admin"; id = 1; }
        else if (username === "cook") { role = "cook"; id = 3; }

        localStorage.setItem('token', access_token);
        localStorage.setItem('role', role);
        localStorage.setItem('user_id', id);

        setUser({ username, role, id });
        return role;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};