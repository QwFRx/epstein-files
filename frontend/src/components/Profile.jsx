import { useEffect, useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // В routers/orders.py есть эндпоинт get_my_orders
    api.get('/orders/my')
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="page">
      <h1>Привет, {user?.username}!</h1>
      <div className="card">
        <h3>Мои заказы</h3>
        {orders.length === 0 ? (
          <p>Вы еще ничего не заказывали.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Блюдо ID</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.menu_item_id}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    {order.is_received ? 
                      <span className="status-done">Получено</span> : 
                      <span className="status-wait">Ожидает</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}