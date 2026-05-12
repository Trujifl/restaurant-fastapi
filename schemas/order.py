from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Optional
from datetime import datetime


OrderStatus = Literal[
    "pending",
    "in_progress",
    "ready",
    "delivered",
    "completed",
    "cancelled",
    "unpaid",
]

PaymentMethod = Literal[
    "cash",
    "card",
    "transfer",
]


class ProductSummary(BaseModel):
    id: int
    name: str
    price: float
    category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    table_id: int
    note: Optional[str] = None
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderClose(BaseModel):
    payment_method: PaymentMethod


class OrderItem(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: Optional[ProductSummary] = None

    model_config = ConfigDict(from_attributes=True)


class Order(BaseModel):
    id: int
    table_id: int
    user_id: int
    status: OrderStatus
    note: Optional[str] = None
    timestamp: datetime
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    closed_by_user_id: Optional[int] = None
    items: List[OrderItem] = []

    model_config = ConfigDict(from_attributes=True)