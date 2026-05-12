from pydantic import BaseModel, ConfigDict
from typing import Literal, Optional


TableStatus = Literal["available", "occupied", "reserved"]


class TableBase(BaseModel):
    number: int
    status: Optional[TableStatus] = "available"


class TableCreate(TableBase):
    is_active: bool = True


class TableUpdate(BaseModel):
    number: Optional[int] = None
    status: Optional[TableStatus] = None
    is_active: Optional[bool] = None


class Table(TableBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TableStatusUpdate(BaseModel):
    status: TableStatus