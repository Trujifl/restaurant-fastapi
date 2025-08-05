from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import order as order_schema
from models import order as order_model
from database import SessionLocal
from typing import List


router = APIRouter(prefix="/orders", tags=["Orders"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/by_table/{table_id}", response_model=order_schema.Order)
def get_order_by_table(table_id: int, db: Session = Depends(get_db)):
    order = db.query(order_model.Order).filter(
        order_model.Order.table_id == table_id,
        order_model.Order.status.in_(["pending", "in_progress"])
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="No active order for this table")
    
    return order

@router.post("/", response_model=order_schema.Order)
def create_order(order_data: order_schema.OrderCreate, db: Session = Depends(get_db)):
    db_order = order_model.Order(
        table_id=order_data.table_id,
        user_id=order_data.user_id,
        status=order_data.status,
        note=order_data.note
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in order_data.items:
        db_item = order_model.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[order_schema.Order])
def get_orders(db: Session = Depends(get_db)):
    return db.query(order_model.Order).all()

@router.get("/{order_id}", response_model=order_schema.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.patch("/{order_id}/cancel", response_model=order_schema.Order)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    db_order.status = "cancelled"
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.query(order_model.OrderItem).filter(order_model.OrderItem.order_id == order_id).delete()

    db.delete(order)
    db.commit()
