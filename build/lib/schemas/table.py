from pydantic import BaseModel
from typing import Optional
from typing import Literal


class TableBase(BaseModel):
    number: int
    status: Optional[str] = "available"

class TableCreate(TableBase):
    pass

class Table(TableBase):
    id: int

    class Config:
        orm_mode = True

class TableStatusUpdate(BaseModel):
    status: Literal["available", "occupied", "reserved"]
