from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas, database
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=schemas.OrderOut)
def place_order(
    order_data: schemas.OrderCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == order_data.menu_item_id).first()
    if not item or not item.is_available:
        raise HTTPException(status_code=404, detail="Блюдо недоступно")

    if current_user.food_preferences and item.description:
        user_prefs = current_user.food_preferences.lower()
        item_desc = item.description.lower()
        common_allergens = ["орехи", "молоко", "мед", "яйца"]
        for allergen in common_allergens:
            if allergen in user_prefs and allergen in item_desc:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Внимание! Блюдо содержит аллерген: {allergen}"
                )

    recipe_items = db.query(models.Recipe).filter(models.Recipe.menu_item_id == item.id).all()
    for ingredient_req in recipe_items:
        inventory_item = db.query(models.Inventory).filter(models.Inventory.id == ingredient_req.inventory_id).first()
        if inventory_item.quantity < ingredient_req.quantity_required:
            raise HTTPException(
                status_code=400, 
                detail=f"Блюдо нельзя приготовить: закончился продукт '{inventory_item.product_name}'"
            )

    if current_user.balance < item.price:
        raise HTTPException(status_code=402, detail="Недостаточно средств")

    try:
        current_user.balance -= item.price
        for ingredient_req in recipe_items:
            inventory_item = db.query(models.Inventory).filter(models.Inventory.id == ingredient_req.inventory_id).first()
            inventory_item.quantity -= ingredient_req.quantity_required

        new_order = models.Order(
            user_id=current_user.id,
            menu_item_id=item.id,
            order_date=order_data.order_date,
            payment_type=order_data.payment_type,
            is_paid=True
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return new_order
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Ошибка транзакции")

@router.get("/my", response_model=List[schemas.OrderOut])
def get_my_orders(user_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Order).filter(models.Order.user_id == user_id).all()

@router.patch("/{order_id}/receive", response_model=schemas.OrderOut)
def mark_order_as_received(order_id: int, db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    if db_order.is_received:
        raise HTTPException(status_code=400, detail="Питание по этому заказу уже получено")
    
    db_order.is_received = True
    db.commit()
    db.refresh(db_order)
    return db_order