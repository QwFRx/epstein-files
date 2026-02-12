from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    role: str
    food_preferences: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    balance: float
    created_at: datetime
    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    meal_type: str
    date: date
    is_available: bool = True

class RecipeBase(BaseModel):
    inventory_id: int
    quantity_required: float

class RecipeOut(BaseModel):
    inventory_id: int
    quantity_required: float
    class Config:
        from_attributes = True

class MenuItemOut(MenuItemBase):
    id: int
    ingredients: List[RecipeOut] = []
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    menu_item_id: int
    payment_type: str
    order_date: date

class OrderOut(BaseModel):
    id: int
    user_id: int
    menu_item_id: int
    is_paid: bool
    is_received: bool
    created_at: datetime
    class Config:
        from_attributes = True

class PurchaseRequestCreate(BaseModel):
    product_name: str
    requested_quantity: float
    unit: str

class PurchaseRequestUpdate(BaseModel):
    status: str

class PurchaseRequestOut(PurchaseRequestCreate):
    id: int
    status: str
    requested_by: int
    approved_by: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    menu_item_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(ReviewCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

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