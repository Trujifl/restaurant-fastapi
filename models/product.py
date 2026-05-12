from sqlalchemy import Boolean, Column, Float, Integer, String
from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)