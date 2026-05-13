from datetime import datetime, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import SessionLocal
from models import order as order_model
from models.cash_closing import CashClosing
from models.user import User
from schemas import cash_closing as cash_closing_schema
from utils.auth import require_roles


router = APIRouter(prefix="/cash-closings", tags=["Cash Closings"])


CASH_CLOSING_ROLES = ["admin", "cashier"]
ACTIVE_ORDER_STATUSES = ["pending", "in_progress", "ready", "delivered"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_order_total(order):
    total = 0

    for item in order.items:
        if item.product:
            total += item.product.price * item.quantity

    return total


def build_daily_closing_data(db: Session):
    today = datetime.now().date()

    start_of_day = datetime.combine(today, time.min)
    end_of_day = datetime.combine(today, time.max)

    completed_orders = db.query(order_model.Order).filter(
        order_model.Order.status == "completed",
        or_(
            order_model.Order.paid_at.between(start_of_day, end_of_day),
            (
                (order_model.Order.paid_at == None)
                & (order_model.Order.timestamp >= start_of_day)
                & (order_model.Order.timestamp <= end_of_day)
            ),
        ),
    ).all()

    cancelled_orders = db.query(order_model.Order).filter(
        order_model.Order.status == "cancelled",
        order_model.Order.timestamp >= start_of_day,
        order_model.Order.timestamp <= end_of_day,
    ).all()

    unpaid_orders = db.query(order_model.Order).filter(
        order_model.Order.status == "unpaid",
        order_model.Order.timestamp >= start_of_day,
        order_model.Order.timestamp <= end_of_day,
    ).all()

    active_orders = db.query(order_model.Order).filter(
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES)
    ).all()

    payment_totals = {
        "cash": 0,
        "card": 0,
        "transfer": 0,
    }

    payment_counts = {
        "cash": 0,
        "card": 0,
        "transfer": 0,
    }

    total_sales = 0
    unpaid_total = 0

    for order in completed_orders:
        order_total = get_order_total(order)
        total_sales += order_total

        if order.payment_method in payment_totals:
            payment_totals[order.payment_method] += order_total
            payment_counts[order.payment_method] += 1

    for order in unpaid_orders:
        unpaid_total += get_order_total(order)

    return {
        "date": str(today),
        "completed_orders": len(completed_orders),
        "cancelled_orders": len(cancelled_orders),
        "unpaid_orders": len(unpaid_orders),
        "active_orders": len(active_orders),
        "total_sales": total_sales,
        "unpaid_total": unpaid_total,
        "payment_totals": payment_totals,
        "payment_counts": payment_counts,
    }


@router.get("/preview/today", response_model=cash_closing_schema.CashClosingPreview)
def preview_today_cash_closing(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(CASH_CLOSING_ROLES)),
):
    return build_daily_closing_data(db)


@router.post("/", response_model=cash_closing_schema.CashClosing)
def create_cash_closing(
    closing_data: cash_closing_schema.CashClosingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(CASH_CLOSING_ROLES)),
):
    closing_info = build_daily_closing_data(db)
    closing_date = datetime.now().date()

    existing_closing = db.query(CashClosing).filter(
        CashClosing.closing_date == closing_date
    ).first()

    if existing_closing:
        raise HTTPException(
            status_code=400,
            detail="Cash closing for today already exists",
        )

    if closing_info["active_orders"] > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot close cash register while there are active orders",
        )

    new_closing = CashClosing(
        closing_date=closing_date,
        closed_by_user_id=current_user.id,
        cash_total=closing_info["payment_totals"]["cash"],
        card_total=closing_info["payment_totals"]["card"],
        transfer_total=closing_info["payment_totals"]["transfer"],
        total_sales=closing_info["total_sales"],
        unpaid_total=closing_info["unpaid_total"],
        completed_orders=closing_info["completed_orders"],
        cancelled_orders=closing_info["cancelled_orders"],
        unpaid_orders=closing_info["unpaid_orders"],
        active_orders=closing_info["active_orders"],
        notes=closing_data.notes,
    )

    db.add(new_closing)
    db.commit()
    db.refresh(new_closing)

    return new_closing


@router.get("/", response_model=list[cash_closing_schema.CashClosing])
def get_cash_closings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(CASH_CLOSING_ROLES)),
):
    return db.query(CashClosing).order_by(CashClosing.closed_at.desc()).all()


@router.get("/{closing_id}", response_model=cash_closing_schema.CashClosing)
def get_cash_closing_by_id(
    closing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(CASH_CLOSING_ROLES)),
):
    closing = db.query(CashClosing).filter(
        CashClosing.id == closing_id
    ).first()

    if not closing:
        raise HTTPException(status_code=404, detail="Cash closing not found")

    return closing