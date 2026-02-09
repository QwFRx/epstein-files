import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Admin = () => {
    const { logout } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        loadStats();
        loadRequests();
    }, []);

    const loadStats = async () => {
        try { const res = await api.get('/admin/stats/attendance'); setStats(res.data); }
        catch (e) { }
    };

    const loadRequests = async () => {
        try { const res = await api.get('/admin/purchase-requests'); setRequests(res.data); }
        catch (e) { }
    };

    const approveRequest = async (id) => {
        try {
            await api.patch(`/admin/purchase-requests/${id}/approve?admin_id=1`);
            loadRequests();
        } catch (e) { alert("Ошибка"); }
    };

    return (
        <div className="container">
            <header className="flex-header">
                <h1>🛡️ Администрирование</h1>
                <button onClick={logout} className="btn-logout">Выйти</button>
            </header>

            <div className="card">
                <h3>📊 Статистика посещаемости (Live)</h3>
                {stats ? (
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div>
                            <h1>{stats.fed_count}</h1>
                            <small>Поели</small>
                        </div>
                        <div>
                            <h1>{stats.waiting_count}</h1>
                            <small style={{ color: 'red' }}>В очереди</small>
                        </div>
                        <div>
                            <h1>{stats.total_attendance}</h1>
                            <small>Всего оплат</small>
                        </div>
                    </div>
                ) : <p>Загрузка...</p>}
            </div>

            <div className="card">
                <h3>📑 Заявки на закупку</h3>
                <table>
                    <thead><tr><th>Продукт</th><th>Кол-во</th><th>Статус</th><th>Действие</th></tr></thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id}>
                                <td>{req.product_name}</td>
                                <td>{req.requested_quantity} {req.unit}</td>
                                <td>{req.status}</td>
                                <td>
                                    {req.status === 'pending' && (
                                        <button className="action-small" onClick={() => approveRequest(req.id)}>
                                            ✅ Одобрить
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

export default Admin;