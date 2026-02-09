import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверка токена при загрузке страницы
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Запрашиваем данные о себе (нужен эндпоинт /users/me, если его нет - используем костыль или декод)
          // В твоем коде orders.py использует get_current_user, так что токен валиден.
          // Для простоты сохраним имя пользователя в localStorage при логине.
          const storedUser = localStorage.getItem('username');
          const storedRole = localStorage.getItem('role');
          if (storedUser) setUser({ username: storedUser, role: storedRole });
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (username, password) => {
    // FastAPI ожидает x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/auth/login', params);
    const { access_token } = response.data;

    localStorage.setItem('token', access_token);
    
    // В реальном проекте тут лучше сделать запрос за профилем пользователя
    // Но для скорости запишем имя, которое ввели
    localStorage.setItem('username', username); 
    // Предположим роль по логину (для демо), в идеале бэк должен возвращать роль в login response
    const role = username === 'admin' ? 'admin' : 'student';
    localStorage.setItem('role', role);

    setUser({ username, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};