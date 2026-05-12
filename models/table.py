from sqlalchemy import Boolean, Column, Integer, String
from database import Base


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False)
    status = Column(String, default="available")
    is_active = Column(Boolean, default=True, nullable=False)