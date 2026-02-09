import { useEffect, useState } from 'react';
import api from '../api';

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu/');
      setMenu(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (item) => {
    try {
      setMessage(null);
      // Формат отправки согласно schemas.OrderCreate
      const orderData = {
        menu_item_id: item.id,
        payment_type: "single",
        order_date: new Date().toISOString().split('T')[0] // Сегодняшняя дата YYYY-MM-DD
      };

      await api.post('/orders/', orderData);
      setMessage({ type: 'success', text: `Заказ "${item.name}" успешно оформлен!` });
    } catch (err) {
      // Обработка ошибок (Аллергия или нет денег)
      const errorMsg = err.response?.data?.detail || "Ошибка заказа";
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  if (loading) return <div className="loading">Загрузка меню...</div>;

  return (
    <div className="page">
      <h1>Меню на сегодня</h1>
      
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="menu-grid">
        {menu.map((item) => (
          <div key={item.id} className="menu-card">
            <div className="card-header">
              <h3>{item.name}</h3>
              <span className="price">{item.price} ₽</span>
            </div>
            <p>{item.description}</p>
            <div className="tags">
                <span className="tag">{item.meal_type}</span>
            </div>
            <button 
              onClick={() => handleOrder(item)} 
              className="btn-order"
              disabled={!item.is_available}
            >
              {item.is_available ? "Заказать" : "Нет в наличии"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}