from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Date, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint('balance >= 0', name='check_balance_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    email = Column(String, nullable=True)
    role = Column(String, nullable=False)
    food_preferences = Column(String, nullable=True)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    requests_made = relationship("PurchaseRequest", foreign_keys="[PurchaseRequest.requested_by]", back_populates="requester")
    requests_approved = relationship("PurchaseRequest", foreign_keys="[PurchaseRequest.approved_by]", back_populates="approver")

class MenuItem(Base):
    __tablename__ = "menu_items"
    __table_args__ = (
        CheckConstraint('price >= 0', name='check_price_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    meal_type = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    is_available = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="menu_item")
    reviews = relationship("Review", back_populates="menu_item")
    ingredients = relationship("Recipe", back_populates="menu_item", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    order_date = Column(Date, nullable=False)
    payment_type = Column(String, nullable=False)
    is_paid = Column(Boolean, default=False)
    is_received = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="orders")
    menu_item = relationship("MenuItem", back_populates="orders")

class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        CheckConstraint('quantity >= 0', name='check_quantity_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False, unique=True)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String, nullable=False)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class Recipe(Base):
    __tablename__ = "recipes"
    __table_args__ = (
        CheckConstraint('quantity_required > 0', name='check_req_quantity_positive'),
    )

    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    inventory_id = Column(Integer, ForeignKey("inventory.id"))
    quantity_required = Column(Float, nullable=False)

    menu_item = relationship("MenuItem", back_populates="ingredients")
    ingredient = relationship("Inventory")

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")
    menu_item = relationship("MenuItem", back_populates="reviews")

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    requested_quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)

    requester = relationship("User", foreign_keys=[requested_by], back_populates="requests_made")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="requests_approved")

