from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, datetime
from backend.routers.auth import get_current_user
from backend import models, schemas, database

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- 1. УПРАВЛЕНИЕ ЗАКУПКАМИ ---

@router.get("/purchase-requests", response_model=List[schemas.PurchaseRequestOut])
def get_all_requests(status: str = None, db: Session = Depends(database.get_db)):
    """Просмотр всех заявок на закупку (можно фильтровать по статусу)"""
    query = db.query(models.PurchaseRequest)
    if status:
        query = query.filter(models.PurchaseRequest.status == status)
    return query.all()

@router.patch("/purchase-requests/{req_id}/approve")
def approve_request(req_id: int, admin_id: int, db: Session = Depends(database.get_db)):
    """Согласование заявки на закупку (ТЗ: пункт 2)"""
    req = db.query(models.PurchaseRequest).filter(models.PurchaseRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    req.status = "approved"
    req.approved_by = admin_id
    req.approved_at = datetime.now()
    
    # Логика: при одобрении заявки теоретически должны обновляться остатки в inventory
    # Но обычно это происходит после подтверждения факта привоза товара.
    
    db.commit()
    return {"message": "Заявка одобрена"}

# --- 2. СТАТИСТИКА И ОТЧЕТЫ (ТРЕБОВАНИЕ ТЗ) ---

@router.get("/stats/daily-report")
def get_daily_report(
    day: date = Query(default=date.today()), 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    """
    Формирование отчета о питании и затратах (ТЗ: пункт 6).
    Считает количество заказов и общую сумму за день.
    """
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ только для администраторов")
    
    # Считаем количество выданных (полученных) блюд
    total_orders = db.query(models.Order).filter(
        models.Order.order_date == day,
        models.Order.is_paid == True
    ).count()

    actually_received = db.query(models.Order).filter(
        models.Order.order_date == day,
        models.Order.is_received == True
    ).count()

    # Считаем общую выручку (суммируем цены через Join с таблицей menu_items)
    revenue = db.query(func.sum(models.MenuItem.price)).join(
        models.Order, models.Order.menu_item_id == models.MenuItem.id
    ).filter(
        models.Order.order_date == day,
        models.Order.is_paid == True
    ).scalar() or 0.0

    return {
        "date": day,
        "total_orders_count": total_orders,
        "received_meals_count": actually_received,
        "total_revenue": revenue,
        "attendance_rate": (actually_received / total_orders * 100) if total_orders > 0 else 0
    }


@router.get("/stats/attendance")
def get_attendance_report(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только для админа")
    
    # Считаем, сколько человек оплатили, но еще не забрали еду (прогулы/очередь)
    waiting = db.query(models.Order).filter(models.Order.is_paid == True, models.Order.is_received == False).count()
    # Считаем тех, кто уже поел
    fed = db.query(models.Order).filter(models.Order.is_received == True).count()
    
    return {
        "waiting_count": waiting,
        "fed_count": fed,
        "total_attendance": waiting + fed
    }

# --- 3. УПРАВЛЕНИЕ ИНВЕНТАРЕМ (ОСТАТКАМИ) ---

@router.get("/inventory", response_model=List[schemas.Inventory]) # Нужно добавить схему Inventory в schemas.py
def get_inventory(db: Session = Depends(database.get_db)):
    """Контроль остатков продуктов (ТЗ: пункт 6)"""
    return db.query(models.Inventory).all()


@router.put("/inventory/{item_id}")
def update_inventory(item_id: int, quantity: float, db: Session = Depends(database.get_db)):
    """Ручное обновление остатков администратором"""
    item = db.query(models.Inventory).filter(models.Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден")
    
    item.quantity = quantity
    db.commit()
    return {"message": "Склад обновлен"}