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
    items: List[OrderItem] = []

    model_config = ConfigDict(from_attributes=True)