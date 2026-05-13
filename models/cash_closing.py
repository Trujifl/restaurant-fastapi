from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class CashClosing(Base):
    __tablename__ = "cash_closings"

    id = Column(Integer, primary_key=True, index=True)
    closing_date = Column(Date, unique=True, nullable=False)

    closed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    closed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cash_total = Column(Float, default=0, nullable=False)
    card_total = Column(Float, default=0, nullable=False)
    transfer_total = Column(Float, default=0, nullable=False)

    total_sales = Column(Float, default=0, nullable=False)
    unpaid_total = Column(Float, default=0, nullable=False)

    completed_orders = Column(Integer, default=0, nullable=False)
    cancelled_orders = Column(Integer, default=0, nullable=False)
    unpaid_orders = Column(Integer, default=0, nullable=False)
    active_orders = Column(Integer, default=0, nullable=False)

    notes = Column(String, nullable=True)

    closed_by_user = relationship("User")