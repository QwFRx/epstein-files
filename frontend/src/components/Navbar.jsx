import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="logo">🍎 Canteen</div>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/menu">Меню</Link>
            <Link to="/profile">Профиль ({user.username})</Link>
            <button onClick={logout} className="btn-logout">Выйти</button>
          </>
        ) : (
          <Link to="/login">Войти</Link>
        )}
      </div>
    </nav>
  );
}