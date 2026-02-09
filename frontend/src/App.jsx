import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Menu from './components/Menu';
import Profile from './components/Profile';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Компонент защиты роутов
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Загрузка...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/menu" element={
            <PrivateRoute><Menu /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/menu" />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}