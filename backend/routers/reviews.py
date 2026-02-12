from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas
from backend.database import get_db

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=schemas.ReviewOut)
def create_review(review: schemas.ReviewCreate, user_id: int, db: Session = Depends(get_db)):
    existing_review = db.query(models.Review).filter(
        models.Review.user_id == user_id,
        models.Review.menu_item_id == review.menu_item_id
    ).first()
    if existing_review:
        raise HTTPException(
            status_code=400, 
            detail="Вы уже оставляли отзыв об этом блюде"
        )
    order = db.query(models.Order).filter(
        models.Order.user_id == user_id, 
        models.Order.menu_item_id == review.menu_item_id,
        models.Order.is_received == True
    ).first()
    if not order:
        raise HTTPException(status_code=400, detail="Сначала нужно получить это блюдо")
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
    return db.query(models.Review).filter(models.Review.menu_item_id == item_id).all()

@router.get("/all", response_model=List[schemas.ReviewOut])
def get_all_reviews(db: Session = Depends(get_db)):
    return db.query(models.Review).all()