import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Student from './pages/Student';
import Cook from './pages/Cook';
import Admin from './pages/Admin';s
import './index.css';

// Компонент защиты маршрутов
const PrivateRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Загрузка...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/login" />; // Или на 403
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/student" element={
                        <PrivateRoute role="student"><Student /></PrivateRoute>
                    } />

                    <Route path="/cook" element={
                        <PrivateRoute role="cook"><Cook /></PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <PrivateRoute role="admin"><Admin /></PrivateRoute>
                    } />

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;