import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

const Cook = () => {
    const { logout } = useContext(AuthContext);
    const [inventory, setInventory] = useState([]);
    const [orderId, setOrderId] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            // Убедись, что повар имеет доступ к этому роуту в admin.py
            const res = await api.get('/admin/inventory');
            setInventory(res.data);
        } catch (e) { console.error("Ошибка загрузки склада"); }
    };

    const issueOrder = async () => {
        try {
            await api.patch(`/orders/${orderId}/receive`);
            setStatus(`✅ Заказ #${orderId} выдан. Продукты списаны по рецепту.`);
            setOrderId('');
            loadInventory(); // Обновляем остатки
        } catch (err) {
            setStatus('❌ Ошибка! Проверьте номер или остатки.');
        }
    };

    return (
        <div className="container">
            <header className="flex-header">
                <h1>👨‍🍳 Панель Повара</h1>
                <button onClick={logout} className="btn-logout">Выйти</button>
            </header>

            <div className="card">
                <h3>📤 Выдача питания</h3>
                <p>Введите номер заказа, который назвал ученик:</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="number" placeholder="ID заказа"
                        value={orderId} onChange={e => setOrderId(e.target.value)}
                    />
                    <button className="action" onClick={issueOrder}>Выдать</button>
                </div>
                <p><strong>{status}</strong></p>
            </div>

            <div className="card">
                <h3>📦 Склад (Остатки)</h3>
                <table>
                    <thead><tr><th>Продукт</th><th>Остаток</th><th>Ед. изм.</th></tr></thead>
                    <tbody>
                        {inventory.map(inv => (
                            <tr key={inv.id}>
                                <td>{inv.product_name}</td>
                                <td style={{ color: inv.quantity < 5 ? 'red' : 'black' }}>
                                    {inv.quantity}
                                </td>
                                <td>{inv.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3>📝 Заявка на закупку</h3>
                <p>Форма для создания заявки на продукты (нужен endpoint в API).</p>
                {/* Тут можно добавить форму POST /admin/purchase-requests */}
            </div>
        </div>
    );
};

export default Cook;