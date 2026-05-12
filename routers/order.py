from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import order as order_schema
from models import order as order_model
from models import table as table_model
from models.user import User
from database import SessionLocal
from typing import List
from datetime import datetime, time

from utils.auth import require_roles


router = APIRouter(prefix="/orders", tags=["Orders"])


ACTIVE_ORDER_STATUSES = ["pending", "in_progress", "ready", "delivered"]


VALID_TRANSITIONS = {
    "pending": ["in_progress", "cancelled"],
    "in_progress": ["ready", "cancelled"],
    "ready": ["delivered"],
    "delivered": ["completed"],
    "completed": [],
    "cancelled": [],
}


ORDER_READ_ROLES = ["admin", "waiter", "kitchen", "cashier"]
ORDER_CREATE_ROLES = ["admin", "waiter", "cashier"]
ORDER_KITCHEN_ROLES = ["admin", "kitchen"]
ORDER_DELIVERY_ROLES = ["admin", "waiter", "cashier"]
ORDER_CLOSE_ROLES = ["admin", "cashier", "waiter"]
ORDER_CANCEL_ROLES = ["admin", "waiter", "cashier"]
ORDER_DELETE_ROLES = ["admin"]
ORDER_SUMMARY_ROLES = ["admin", "cashier"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/by_table/{table_id}", response_model=order_schema.Order)
def get_order_by_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_READ_ROLES)),
):
    order = db.query(order_model.Order).filter(
        order_model.Order.table_id == table_id,
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES),
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="No active order for this table")

    return order


@router.get("/history/{table_id}", response_model=List[order_schema.Order])
def get_order_history_by_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_READ_ROLES)),
):
    return db.query(order_model.Order).filter(
        order_model.Order.table_id == table_id
    ).order_by(order_model.Order.timestamp.desc()).all()


@router.get("/summary/daily")
def get_daily_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_SUMMARY_ROLES)),
):
    today = datetime.now().date()

    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)

    completed_orders = db.query(order_model.Order).filter(
        order_model.Order.status == "completed",
        order_model.Order.timestamp >= start_of_day,
        order_model.Order.timestamp <= end_of_day,
    ).all()

    cancelled_orders = db.query(order_model.Order).filter(
        order_model.Order.status == "cancelled",
        order_model.Order.timestamp >= start_of_day,
        order_model.Order.timestamp <= end_of_day,
    ).all()

    active_orders = db.query(order_model.Order).filter(
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES)
    ).all()

    total_sales = 0

    for order in completed_orders:
        for item in order.items:
            if item.product:
                total_sales += item.product.price * item.quantity

    return {
        "date": str(today),
        "completed_orders": len(completed_orders),
        "cancelled_orders": len(cancelled_orders),
        "active_orders": len(active_orders),
        "total_sales": total_sales,
    }


@router.post("/", response_model=order_schema.Order)
def create_order(
    order_data: order_schema.OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_CREATE_ROLES)),
):
    existing_order = db.query(order_model.Order).filter(
        order_model.Order.table_id == order_data.table_id,
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES),
    ).first()

    if existing_order:
        raise HTTPException(status_code=400, detail="Table already has an active order")

    table = db.query(table_model.Table).filter(
        table_model.Table.id == order_data.table_id
    ).first()

    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    db_order = order_model.Order(
        table_id=order_data.table_id,
        user_id=current_user.id,
        status="pending",
        note=order_data.note,
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in order_data.items:
        db_item = order_model.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_READ_ROLES)),
):
    db_order = db.query(order_model.Order).filter(
        order_model.Order.id == order_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    current_status = db_order.status
    new_status = status_data.status

    if current_status not in VALID_TRANSITIONS:
        raise HTTPException(status_code=400, detail="Invalid current order status")

    if new_status not in VALID_TRANSITIONS[current_status]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status} to {new_status}",
        )

    if new_status in ["in_progress", "ready"] and current_user.role not in ORDER_KITCHEN_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only kitchen or admin can move orders to this status",
        )

    if new_status == "delivered" and current_user.role not in ORDER_DELIVERY_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only waiter, cashier or admin can mark orders as delivered",
        )

    if new_status == "completed" and current_user.role not in ORDER_CLOSE_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only waiter, cashier or admin can complete orders",
        )

    if new_status == "cancelled" and current_user.role not in ORDER_CANCEL_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Only waiter, cashier or admin can cancel orders",
        )

    table = db.query(table_model.Table).filter(
        table_model.Table.id == db_order.table_id
    ).first()

    db_order.status = new_status

    if new_status in ["completed", "cancelled"] and table:
        table.status = "available"

    if new_status in ACTIVE_ORDER_STATUSES and table:
        table.status = "occupied"

    db.commit()
    db.refresh(db_order)

    return db_order


@router.patch("/{order_id}/close", response_model=order_schema.Order)
def close_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_CLOSE_ROLES)),
):
    db_order = db.query(order_model.Order).filter(
        order_model.Order.id == order_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status != "delivered":
        raise HTTPException(
            status_code=400,
            detail="Only delivered orders can be closed",
        )

    table = db.query(table_model.Table).filter(
        table_model.Table.id == db_order.table_id
    ).first()

    db_order.status = "completed"

    if table:
        table.status = "available"

    db.commit()
    db.refresh(db_order)

    return db_order


@router.patch("/{order_id}/cancel", response_model=order_schema.Order)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_CANCEL_ROLES)),
):
    db_order = db.query(order_model.Order).filter(
        order_model.Order.id == order_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status not in ["pending", "in_progress"]:
        raise HTTPException(
            status_code=400,
            detail="Only pending or in-progress orders can be cancelled",
        )

    table = db.query(table_model.Table).filter(
        table_model.Table.id == db_order.table_id
    ).first()

    db_order.status = "cancelled"

    if table:
        table.status = "available"

    db.commit()
    db.refresh(db_order)

    return db_order


@router.get("/", response_model=List[order_schema.Order])
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_READ_ROLES)),
):
    return db.query(order_model.Order).all()


@router.get("/{order_id}", response_model=order_schema.Order)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_READ_ROLES)),
):
    order = db.query(order_model.Order).filter(
        order_model.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return order


@router.delete("/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ORDER_DELETE_ROLES)),
):
    order = db.query(order_model.Order).filter(
        order_model.Order.id == order_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.query(order_model.OrderItem).filter(
        order_model.OrderItem.order_id == order_id
    ).delete()

    db.delete(order)
    db.commit()