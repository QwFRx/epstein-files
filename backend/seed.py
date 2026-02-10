# backend/seed.py
from backend.database import SessionLocal, engine, Base
from backend import models
from backend.routers.auth import get_password_hash
from datetime import date

def seed_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Пользователи
    admin = models.User(username="admin", password_hash=get_password_hash("password123"), role="admin", balance=1000000000000)
    cook = models.User(username="cook", password_hash=get_password_hash("password123"), role="cook", balance=0)
    student = models.User(username="student", password_hash=get_password_hash("password123"), role="student", balance=1000.0, food_preferences="аллергия на орехи")
    db.add_all([admin, student, cook])
    db.commit()

    # 2. Ингредиенты на складе
    flour = models.Inventory(product_name="Мука", quantity=10.0, unit="кг")
    cheese = models.Inventory(product_name="Сыр", quantity=5.0, unit="кг")
    db.add_all([flour, cheese])
    db.commit()

    # 3. Блюдо
    pizza = models.MenuItem(
        name="Пицца школьная", 
        description="Вкусная пицца, содержит сыр и муку. Без орехов.", 
        price=70.0, 
        meal_type="lunch", 
        date=date.today(), 
        is_available=True
    )
    db.add(pizza)
    db.commit()

    # 4. РЕЦЕПТ (Связываем пиццу с продуктами)
    # На 1 пиццу нужно 0.2 кг муки и 0.1 кг сыра
    recipe1 = models.Recipe(menu_item_id=pizza.id, inventory_id=flour.id, quantity_required=0.2)
    recipe2 = models.Recipe(menu_item_id=pizza.id, inventory_id=cheese.id, quantity_required=0.1)
    db.add_all([recipe1, recipe2])
    db.commit()

    print("База готова! Теперь при заказе Пиццы будет списываться мука и сыр.")

if __name__ == "__main__":
    seed_data()