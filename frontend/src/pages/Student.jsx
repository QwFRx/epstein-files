import React, { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Student = () => {
    const { user, logout } = useContext(AuthContext);
    const [menu, setMenu] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [preferences, setPreferences] = useState(''); // Аллергии
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchMenu();
        fetchOrders();
        // Тут можно добавить запрос профиля для загрузки сохраненных аллергий
    }, []);

    const fetchMenu = async () => {
        try { const res = await api.get('/menu/'); setMenu(res.data); }
        catch (err) { console.error(err); }
    };

    const fetchOrders = async () => {
        try {
            // В реальном проекте ID берется из токена на сервере
            const res = await api.get(`/orders/my?user_id=${user.id}`);
            setMyOrders(res.data);
        } catch (err) { console.error(err); }
    };

    const handleOrder = async (item) => {
        try {
            await api.post('/orders/', {
                menu_item_id: item.id,
                payment_type: "account", // Или "subscription" согласно PDF
                order_date: new Date().toISOString().split('T')[0]
            });
            setMsg(`✅ Заказано: ${item.name}`);
            fetchOrders();
        } catch (err) {
            setMsg('❌ Ошибка: ' + (err.response?.data?.detail || 'Сбой заказа'));
        }
    };

    const confirmReceipt = async (orderId) => {
        try {
            await api.patch(`/orders/${orderId}/receive`);
            setMsg(`✅ Получение заказа #${orderId} подтверждено!`);
            fetchOrders();
        } catch (err) {
            setMsg('❌ Не удалось подтвердить получение');
        }
    };

    // ⚠️ Логика безопасности питания (Аллергены)
    const isDangerous = (desc) => {
        if (!preferences) return false;
        const allergens = preferences.toLowerCase().split(',');
        return allergens.some(a => a.trim() && desc.toLowerCase().includes(a.trim()));
    };

    return (
        <div className="container">
            <header className="flex-header">
                <h1>🎓 Кабинет ученика: {user?.username}</h1>
                <button onClick={logout} className="btn-logout">Выйти</button>
            </header>

            {msg && <div className="notice">{msg}</div>}

            <div className="card">
                <h3>⚠️ Фильтр аллергенов</h3>
                <input
                    placeholder="Например: орехи, мед (через запятую)"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    style={{ borderColor: preferences ? '#ff9800' : '#ddd' }}
                />
                <small>Блюда с этими продуктами будут подсвечены красным.</small>
            </div>

            <div className="card">
                <h2>🍽 Меню на сегодня</h2>
                <table>
                    <thead>
                        <tr><th>Блюдо</th><th>Цена</th><th>Состав</th><th>Действие</th></tr>
                    </thead>
                    <tbody>
                        {menu.map(item => {
                            const danger = isDangerous(item.description || '');
                            return (
                                <tr key={item.id} style={{ background: danger ? '#ffebee' : 'transparent' }}>
                                    <td>
                                        {item.name}
                                        {danger && <span style={{ color: 'red', fontWeight: 'bold' }}> (ОПАСНО!)</span>}
                                    </td>
                                    <td>{item.price} ₽</td>
                                    <td>{item.description}</td>
                                    <td>
                                        <button className="action" onClick={() => handleOrder(item)} disabled={danger}>
                                            {danger ? 'Нельзя' : 'Купить'}
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3>🧾 История заказов</h3>
                <table>
                    <thead><tr><th>ID</th><th>Статус</th><th>Действие</th></tr></thead>
                    <tbody>
                        {myOrders.map(order => (
                            <tr key={order.id}>
                                <td>#{order.id}</td>
                                <td>
                                    {order.is_received
                                        ? <span style={{ color: 'green' }}>Выдано</span>
                                        : <span style={{ color: 'orange' }}>Ожидает</span>}
                                </td>
                                <td>
                                    {!order.is_received && (
                                        <button className="action-small" onClick={() => confirmReceipt(order.id)}>
                                            Я получил еду
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Student;