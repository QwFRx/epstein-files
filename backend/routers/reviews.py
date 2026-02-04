from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas
from backend.database import get_db

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=schemas.ReviewOut)
def create_review(review: schemas.ReviewCreate, user_id: int, db: Session = Depends(get_db)):
    """Оставить отзыв о блюде (ТЗ: пункт 1)"""
    
    # Проверяем, существует ли блюдо
    item = db.query(models.MenuItem).filter(models.MenuItem.id == review.menu_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Блюдо не найдено")

    # Проверяем, заказывал ли пользователь это блюдо (логично оставлять отзыв только о том, что ел)
    order = db.query(models.Order).filter(
        models.Order.user_id == user_id, 
        models.Order.menu_item_id == review.menu_item_id,
        models.Order.is_received == True
    ).first()
    
    if not order:
        raise HTTPException(status_code=400, detail="Вы не можете оставить отзыв о блюде, которое еще не получили")

    db_review = models.Review(
        user_id=user_id,
        menu_item_id=review.menu_item_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/item/{item_id}", response_model=List[schemas.ReviewOut])
def get_item_reviews(item_id: int, db: Session = Depends(get_db)):
    """Получить все отзывы для конкретного блюда"""
    return db.query(models.Review).filter(models.Review.menu_item_id == item_id).all()

@router.get("/all", response_model=List[schemas.ReviewOut])
def get_all_reviews(db: Session = Depends(get_db)):
    """Для админа: просмотр всей обратной связи"""
    return db.query(models.Review).all()