from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import order as order_schema
from models import order as order_model
from models import table as table_model
from database import SessionLocal
from typing import List


router = APIRouter(prefix="/orders", tags=["Orders"])


ACTIVE_ORDER_STATUSES = ["pending", "in_progress", "ready", "delivered"]


VALID_TRANSITIONS = {
    "pending": ["in_progress", "cancelled"],
    "in_progress": ["ready", "cancelled"],
    "ready": ["delivered", "cancelled"],
    "delivered": ["completed"],
    "completed": [],
    "cancelled": []
}


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


@router.get("/by_table/{table_id}", response_model=order_schema.Order)
def get_order_by_table(table_id: int, db: Session = Depends(get_db)):
    order = db.query(order_model.Order).filter(
        order_model.Order.table_id == table_id,
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES)
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="No active order for this table")

    return order


@router.get("/history/{table_id}", response_model=List[order_schema.Order])
def get_order_history_by_table(table_id: int, db: Session = Depends(get_db)):
    return db.query(order_model.Order).filter(
        order_model.Order.table_id == table_id
    ).order_by(order_model.Order.timestamp.desc()).all()


@router.post("/", response_model=order_schema.Order)
def create_order(order_data: order_schema.OrderCreate, db: Session = Depends(get_db)):
    existing_order = db.query(order_model.Order).filter(
        order_model.Order.table_id == order_data.table_id,
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES)
    ).first()

    if existing_order:
        raise HTTPException(status_code=400, detail="Table already has an active order")

    table = db.query(table_model.Table).filter(table_model.Table.id == order_data.table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    db_order = order_model.Order(
        table_id=order_data.table_id,
        user_id=order_data.user_id,
        status="pending",
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

    table.status = "occupied"

    db.commit()
    db.refresh(db_order)

    return db_order


@router.patch("/{order_id}/status", response_model=order_schema.Order)
def update_order_status(
    order_id: int,
    status_data: order_schema.OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    db_order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    current_status = db_order.status
    new_status = status_data.status

    if new_status not in VALID_TRANSITIONS[current_status]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {new_status}"
        )

    table = db.query(table_model.Table).filter(table_model.Table.id == db_order.table_id).first()

    db_order.status = new_status

    if new_status in ["completed", "cancelled"] and table:
        table.status = "available"

    if new_status in ACTIVE_ORDER_STATUSES and table:
        table.status = "occupied"

    db.commit()
    db.refresh(db_order)

    return db_order


@router.patch("/{order_id}/close", response_model=order_schema.Order)
def close_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status != "delivered":
        raise HTTPException(
            status_code=400,
            detail="Only delivered orders can be closed"
        )

    table = db.query(table_model.Table).filter(table_model.Table.id == db_order.table_id).first()

    db_order.status = "completed"

    if table:
        table.status = "available"

    db.commit()
    db.refresh(db_order)

    return db_order


@router.patch("/{order_id}/cancel", response_model=order_schema.Order)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status not in ["pending", "in_progress", "ready"]:
        raise HTTPException(
            status_code=400,
            detail="Order cannot be cancelled at this stage"
        )

    table = db.query(table_model.Table).filter(table_model.Table.id == db_order.table_id).first()

    db_order.status = "cancelled"

    if table:
        table.status = "available"

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


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(order_model.Order).filter(order_model.Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.query(order_model.OrderItem).filter(order_model.OrderItem.order_id == order_id).delete()

    db.delete(order)
    db.commit()
