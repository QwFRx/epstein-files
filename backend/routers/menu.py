from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as date_type

from backend import models, schemas, database
from backend.routers.auth import get_current_user


router = APIRouter(prefix="/menu", tags=["Menu"])

@router.get("/", response_model=List[schemas.MenuItemOut])
def get_menu(
    day: Optional[date_type] = Query(None, description="Дата меню (по умолчанию сегодня)"),
    meal_type: Optional[str] = Query(None, description="breakfast или lunch"),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.MenuItem).filter(models.MenuItem.is_available == True)
    
    if day:
        query = query.filter(models.MenuItem.date == day)
    if meal_type:
        query = query.filter(models.MenuItem.meal_type == meal_type)
        
    return query.all()

@router.post("/", response_model=schemas.MenuItemOut)
def create_menu_item(
    item: schemas.MenuItemBase, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role not in ["admin", "cook"]:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    db_item = models.MenuItem(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item