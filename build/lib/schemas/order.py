from pydantic import BaseModel
from typing import List, Literal
from datetime import datetime
from typing import Optional


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderBase(BaseModel):
    table_id: int
    user_id: int
    status: Literal["pending", "in_progress", "completed", "cancelled"] = "pending"
    note: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderItem(OrderItemCreate):
    id: int

    class Config:
        orm_mode = True

class Order(OrderBase):
    id: int
    timestamp: datetime
    items: List[OrderItem] = []

    class Config:
        orm_mode = True
