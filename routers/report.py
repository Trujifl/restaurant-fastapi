from datetime import date, datetime, time
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import SessionLocal
from models import order as order_model
from models.user import User
from utils.auth import require_roles


router = APIRouter(prefix="/reports", tags=["Reports"])


REPORT_ROLES = ["admin", "cashier"]
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


@router.get("/daily")
def get_daily_report(
    report_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(REPORT_ROLES)),
):
    start_of_day = datetime.combine(report_date, time.min)
    end_of_day = datetime.combine(report_date, time.max)

    completed_orders = db.query(order_model.Order).filter(
        order_model.Order.status == "completed",
        order_model.Order.paid_at >= start_of_day,
        order_model.Order.paid_at <= end_of_day,
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
        "date": str(report_date),
        "completed_orders": len(completed_orders),
        "cancelled_orders": len(cancelled_orders),
        "unpaid_orders": len(unpaid_orders),
        "active_orders": len(active_orders),
        "total_sales": total_sales,
        "unpaid_total": unpaid_total,
        "payment_totals": payment_totals,
        "payment_counts": payment_counts,
    }