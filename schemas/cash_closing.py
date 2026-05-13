from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class CashClosingCreate(BaseModel):
    notes: Optional[str] = None


class CashClosingPreview(BaseModel):
    date: str
    completed_orders: int
    cancelled_orders: int
    unpaid_orders: int
    active_orders: int
    total_sales: float
    unpaid_total: float
    payment_totals: dict
    payment_counts: dict


class CashClosing(BaseModel):
    id: int
    closing_date: date
    closed_by_user_id: int
    closed_at: datetime

    cash_total: float
    card_total: float
    transfer_total: float

    total_sales: float
    unpaid_total: float

    completed_orders: int
    cancelled_orders: int
    unpaid_orders: int
    active_orders: int

    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)