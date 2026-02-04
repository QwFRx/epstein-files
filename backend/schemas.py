# backend/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# --- СХЕМЫ ДЛЯ ПОЛЬЗОВАТЕЛЯ (User) ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    role: str  # 'student', 'cook', 'admin' [cite: 18-22]
    food_preferences: Optional[str] = None # Аллергии [cite: 29]

class UserCreate(UserBase):
    password: str # Только при регистрации [cite: 25]

class UserOut(UserBase):
    id: int
    balance: float # Баланс для оплаты 
    created_at: datetime

    class Config:
        from_attributes = True

# --- СХЕМЫ ДЛЯ МЕНЮ (MenuItem) ---
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    meal_type: str # 'breakfast' или 'lunch' [cite: 26]
    date: date
    is_available: bool = True

class RecipeBase(BaseModel):
    inventory_id: int
    quantity_required: float

class RecipeOut(BaseModel):
    inventory_id: int
    quantity_required: float
    # Можно добавить информацию о названии ингредиента через ORM
    class Config:
        from_attributes = True

class MenuItemOut(MenuItemBase):
    id: int
    ingredients: List[RecipeOut] = [] # Важно для отображения состава
    class Config:
        from_attributes = True

# --- СХЕМЫ ДЛЯ ЗАКАЗОВ (Order) ---
class OrderCreate(BaseModel):
    menu_item_id: int
    payment_type: str # 'single' или 'subscription' [cite: 27, 74]
    order_date: date

class OrderOut(BaseModel):
    id: int
    user_id: int
    menu_item_id: int
    is_paid: bool
    is_received: bool # Отметка о получении [cite: 28, 75]
    created_at: datetime

    class Config:
        from_attributes = True

# --- СХЕМЫ ДЛЯ ЗАКУПОК (PurchaseRequest) ---
class PurchaseRequestCreate(BaseModel):
    product_name: str
    requested_quantity: float
    unit: str

class PurchaseRequestUpdate(BaseModel):
    status: str # 'approved' или 'rejected' [cite: 40, 77]

class PurchaseRequestOut(PurchaseRequestCreate):
    id: int
    status: str
    requested_by: int
    approved_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- СХЕМЫ ДЛЯ ОТЗЫВОВ (Review) ---
class ReviewCreate(BaseModel):
    menu_item_id: int
    rating: int = Field(ge=1, le=5) # Оценка 1-5 [cite: 30]
    comment: Optional[str] = None

class ReviewOut(ReviewCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- СХЕМЫ ДЛЯ ИНВЕНТАРЯ (Inventory) ---
class InventoryBase(BaseModel):
    product_name: str
    quantity: float
    unit: str

class Inventory(InventoryBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


