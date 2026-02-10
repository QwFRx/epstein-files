import React, { useState, useEffect } from 'react';
import { authApi, menuApi, orderApi, reviewApi, adminApi } from './api';
import { 
  Utensils, User, LogOut, ShoppingBag, CheckCircle, 
  ClipboardList, TrendingUp, Users, Package, Truck, AlertCircle, Plus
} from 'lucide-react';
import './App.css'; 

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user_info')));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      authApi.getMe()
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user_info', JSON.stringify(res.data));
        })
        .catch(() => handleLogout())
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
  };

  if (loading) return <div className="auth-container">Загрузка профиля...</div>;

  if (!token || !user) {
    return <AuthScreen setToken={setToken} setUser={setUser} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="nav-brand">
            <Utensils /> Школьная Столовая
          </div>
          <div className="nav-user">
            {user.role === 'student' && <span className="balance-badge">Баланс: {user.balance} ₽</span>}
            <div className="user-pill">
              <User size={16} />
              <span>{user.username} <small>({user.role})</small></span>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="container">
        {user.role === 'student' && <StudentDashboard user={user} setUser={setUser} />}
        {user.role === 'cook' && <CookDashboard user={user} />}
        {user.role === 'admin' && <AdminDashboard user={user} />}
      </main>
    </div>
  );
}

// ==========================================
// 🔐 ЭКРАН АВТОРИЗАЦИИ
// ==========================================
function AuthScreen({ setToken, setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', food_preferences: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const cleanData = {
          ...formData,
          role: 'student',
          email: formData.email.trim() === "" ? null : formData.email,
          food_preferences: formData.food_preferences.trim() === "" ? null : formData.food_preferences
        };
        await authApi.register(cleanData);
        alert("Успешно! Войдите в аккаунт.");
        setIsRegister(false);
      } else {
        const loginRes = await authApi.login(formData.username, formData.password);
        localStorage.setItem('access_token', loginRes.data.access_token);
        
        const profileRes = await authApi.getMe();
        const userData = profileRes.data;
        
        localStorage.setItem('user_info', JSON.stringify(userData));
        setToken(loginRes.data.access_token);
        setUser(userData);
      }
    } catch (err) {
      alert("Ошибка: " + (err.response?.data?.detail || "Проверьте данные"));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
          <Utensils size={40} color="#4f46e5" />
          <h2>{isRegister ? 'Создать аккаунт' : 'Вход в систему'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Логин</label>
            <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Email (необязательно)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Аллергии (если есть)</label>
                <input type="text" placeholder="Например: орехи" value={formData.food_preferences} onChange={e => setFormData({...formData, food_preferences: e.target.value})} />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '0.5rem'}}>
            {isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
        <p className="auth-switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация ученика'}
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 🎓 ПАНЕЛЬ УЧЕНИКА
// ==========================================
function StudentDashboard({ user, setUser }) {
  const [view, setView] = useState('menu');
  return (
    <>
      <div className="meal-filter">
        <button onClick={() => setView('menu')} className={`btn btn-outline ${view === 'menu' ? 'active' : ''}`}>🍽 Меню</button>
        <button onClick={() => setView('orders')} className={`btn btn-outline ${view === 'orders' ? 'active' : ''}`}>📦 Мои Заказы</button>
      </div>
      {view === 'menu' ? <StudentMenu user={user} setUser={setUser} /> : <StudentOrders user={user} />}
    </>
  );
}

function StudentMenu({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [mealType, setMealType] = useState('lunch');

  useEffect(() => {
    menuApi.getMenu(mealType).then(res => setItems(res.data));
  }, [mealType]);

  const handleOrder = async (item) => {
    if (!window.confirm(`Заказать ${item.name} за ${item.price}₽?`)) return;
    try {
      await orderApi.placeOrder(item.id);
      alert("Заказ успешно оплачен!");
      const updatedProfile = await authApi.getMe();
      setUser(updatedProfile.data);
      localStorage.setItem('user_info', JSON.stringify(updatedProfile.data));
    } catch (err) {
      alert(err.response?.data?.detail || "Недостаточно средств или ошибка");
    }
  };

  return (
    <div style={{width: '100%'}}>
      <div className="meal-filter" style={{background: 'none', marginBottom: '1.5rem'}}>
        <button className={`btn btn-outline ${mealType === 'breakfast' ? 'active' : ''}`} onClick={() => setMealType('breakfast')}>☕ Завтрак</button>
        <button className={`btn btn-outline ${mealType === 'lunch' ? 'active' : ''}`} onClick={() => setMealType('lunch')}>🍲 Обед</button>
      </div>
      <div className="menu-grid">
        {items.map(item => (
          <div key={item.id} className="menu-card">
            <div className="card-image">{item.meal_type === 'breakfast' ? '🍳' : '🥘'}</div>
            <div className="card-body">
              <div className="card-header">
                <h3 className="card-title">{item.name}</h3>
                <span className="card-price">{item.price} ₽</span>
              </div>
              <p className="card-desc">{item.description || 'Состав уточняйте на раздаче'}</p>
              <button onClick={() => handleOrder(item)} className="btn btn-primary" style={{width: '100%'}}>
                <ShoppingBag size={18} /> Купить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentOrders({ user }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    orderApi.getMyOrders(user.id).then(res => setOrders(res.data.reverse()));
  }, [user.id]);

  return (
    <div className="orders-list">
      {orders.length === 0 && <p style={{textAlign:'center', color: '#666'}}>У вас пока нет заказов</p>}
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-info">
            <h4>Заказ #{order.id}</h4>
            <div className="order-date">{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <div className="order-status">
            {order.is_received ? (
              <span style={{color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <CheckCircle size={18} /> Получено
              </span>
            ) : (
              <span style={{color: 'var(--warning)', fontWeight: 'bold'}}>Оплачено (Ждет выдачи)</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 👨‍🍳 ПАНЕЛЬ ПОВАРА
// ==========================================
function CookDashboard() {
  const [tab, setTab] = useState('kitchen');
  return (
    <div style={{width: '100%'}}>
      <div className="meal-filter">
        <button onClick={() => setTab('kitchen')} className={`btn btn-outline ${tab==='kitchen'?'active':''}`}>🔔 Выдача</button>
        <button onClick={() => setTab('menu')} className={`btn btn-outline ${tab==='menu'?'active':''}`}>📝 Меню</button>
        <button onClick={() => setTab('inventory')} className={`btn btn-outline ${tab==='inventory'?'active':''}`}>📦 Склад</button>
      </div>
      {tab === 'kitchen' && <CookKitchenView />}
      {tab === 'menu' && <CookMenuView />}
      {tab === 'inventory' && <AdminInventoryView role="cook" />}
    </div>
  );
}

function CookKitchenView() {
  const [orderId, setOrderId] = useState('');
  const handleIssue = async (e) => {
    e.preventDefault();
    if (!orderId) return;
    try {
      await orderApi.receiveOrder(orderId);
      alert(`Готово! Заказ #${orderId} отмечен как выданный.`);
      setOrderId('');
    } catch (err) { alert("Ошибка: Заказ не найден или уже выдан"); }
  };
  return (
    <div style={{maxWidth: '400px', margin: '2rem auto', textAlign: 'center'}}>
      <div className="auth-card">
        <h3>Выдача блюда</h3>
        <form onSubmit={handleIssue}>
          <input className="form-group" type="number" placeholder="Номер заказа" 
            style={{width: '100%', padding: '15px', fontSize: '1.2rem', marginBottom: '1rem', textAlign: 'center'}}
            value={orderId} onChange={e => setOrderId(e.target.value)} />
          <button className="btn btn-primary" style={{width: '100%', padding: '15px'}}>Подтвердить выдачу</button>
        </form>
      </div>
    </div>
  );
}

function CookMenuView() {
  const [form, setForm] = useState({ name: '', price: '', description: '', meal_type: 'lunch', date: new Date().toISOString().split('T')[0] });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await menuApi.addMenuItem(form);
      alert("Блюдо успешно добавлено!");
      setForm({ ...form, name: '', price: '', description: '' });
    } catch (err) { alert("Ошибка при сохранении"); }
  };
  return (
    <div className="auth-card" style={{margin: '0 auto'}}>
      <h3>Добавить блюдо в меню</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label>Название</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><label>Цена (₽)</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
        <div className="form-group"><label>Описание</label><textarea style={{width:'100%', padding:'10px'}} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        <div className="form-group">
          <label>Тип</label>
          <select style={{width:'100%', padding:'10px'}} value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
            <option value="breakfast">☕ Завтрак</option>
            <option value="lunch">🍲 Обед</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{width: '100%'}}><Plus size={18}/> Опубликовать</button>
      </form>
    </div>
  );
}

// ==========================================
// 👑 ПАНЕЛЬ АДМИНИСТРАТОРА
// ==========================================
function AdminDashboard({ user }) {
  const [tab, setTab] = useState('stats');
  return (
    <div style={{width: '100%'}}>
      <div className="meal-filter">
        <button onClick={() => setTab('stats')} className={`btn btn-outline ${tab==='stats'?'active':''}`}><TrendingUp size={16}/> Аналитика</button>
        <button onClick={() => setTab('users')} className={`btn btn-outline ${tab==='users'?'active':''}`}><Users size={16}/> Персонал</button>
        <button onClick={() => setTab('inventory')} className={`btn btn-outline ${tab==='inventory'?'active':''}`}><Package size={16}/> Склад</button>
        <button onClick={() => setTab('requests')} className={`btn btn-outline ${tab==='requests'?'active':''}`}><Truck size={16}/> Закупки</button>
      </div>
      {tab === 'stats' && <AdminStatsView />}
      {tab === 'users' && <AdminUsersView />}
      {tab === 'inventory' && <AdminInventoryView role="admin" />}
      {tab === 'requests' && <AdminRequestsView user={user} />}
    </div>
  );
}

function AdminStatsView() {
  const [stats, setStats] = useState(null);
  
  // ИСПРАВЛЕНО: добавлен [] массив зависимостей
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    adminApi.getDailyReport(today).then(res => setStats(res.data));
  }, []);

  if (!stats) return <p>Загрузка...</p>;
  return (
    <div className="menu-grid">
      <div className="menu-card" style={{padding: '2rem', textAlign: 'center'}}>
        <TrendingUp size={32} color="var(--success)"/>
        <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{stats.total_revenue} ₽</div>
        <div style={{color: '#666'}}>Выручка за сегодня</div>
      </div>
      <div className="menu-card" style={{padding: '2rem', textAlign: 'center'}}>
        <ShoppingBag size={32} color="var(--primary-color)"/>
        <div style={{fontSize: '2rem', fontWeight: 'bold'}}>{stats.total_orders_count}</div>
        <div style={{color: '#666'}}>Заказов</div>
      </div>
    </div>
  );
}

function AdminUsersView() {
  const [form, setForm] = useState({ username: '', password: '', role: 'cook', email: '', food_preferences: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanData = {
      ...form,
      email: form.email.trim() === "" ? null : form.email,
      food_preferences: form.food_preferences.trim() === "" ? null : form.food_preferences
    };

    try {
      await authApi.register(cleanData);
      alert(`Пользователь ${form.username} (${form.role}) создан!`);
      setForm({ username: '', password: '', role: 'cook', email: '', food_preferences: '' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        alert("Ошибка: " + detail.map(d => `${d.loc[1]}: ${d.msg}`).join(", "));
      } else {
        alert("Ошибка: " + (detail || "Не удалось создать пользователя"));
      }
    }
  };

  return (
    <div className="auth-card" style={{margin: '0 auto'}}>
      <h3>Регистрация персонала / Учеников</h3>
      <form onSubmit={handleRegister}>
        <div className="form-group"><label>Логин</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></div>
        <div className="form-group"><label>Пароль</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required /></div>
        <div className="form-group"><label>Email (необязательно)</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
        <div className="form-group">
          <label>Роль</label>
          <select style={{width:'100%', padding:'10px'}} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="student">🎓 Ученик</option>
            <option value="cook">👨‍🍳 Повар</option>
            <option value="admin">👑 Администратор</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{width: '100%'}}>Создать пользователя</button>
      </form>
    </div>
  );
}

function AdminInventoryView({ role }) {
  const [inventory, setInventory] = useState([]);
  
  const fetchInventory = () => {
    adminApi.getInventory().then(res => setInventory(res.data));
  };

  // ИСПРАВЛЕНО: добавлен [] массив зависимостей
  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdate = async (id, currentQty) => {
    if (role !== 'admin') return alert("Только админ может менять остатки");
    const val = prompt("Новое количество:", currentQty);
    if (val !== null) {
      await adminApi.updateInventory(id, parseFloat(val));
      fetchInventory(); // Обновляем данные без перезагрузки всей страницы
    }
  };

  return (
    <div className="orders-list" style={{margin: '0 auto'}}>
      <h3>Склад</h3>
      {inventory.map(item => (
        <div key={item.id} className="order-card">
          <div><b>{item.product_name}</b></div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span style={{fontWeight: 'bold'}}>{item.quantity} {item.unit}</span>
            {role === 'admin' && <button onClick={() => handleUpdate(item.id, item.quantity)} className="btn btn-outline">✏️</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminRequestsView({ user }) {
  const [requests, setRequests] = useState([]);
  
  // ИСПРАВЛЕНО: добавлен [] массив зависимостей
  useEffect(() => {
    adminApi.getRequests('pending').then(res => setRequests(res.data));
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminApi.approveRequest(id, user.id);
      alert("Одобрено");
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) { alert("Ошибка при одобрении"); }
  };

  return (
    <div className="orders-list">
      <h3>Заявки на закупку</h3>
      {requests.length === 0 && <p style={{textAlign: 'center', color: '#666'}}>Нет активных заявок</p>}
      {requests.map(req => (
        <div key={req.id} className="order-card">
          <div><b>{req.product_name}</b>: {req.requested_quantity} {req.unit}</div>
          <button onClick={() => handleApprove(req.id)} className="btn btn-primary">Одобрить</button>
        </div>
      ))}
    </div>
  );
}