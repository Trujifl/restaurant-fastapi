from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from schemas import table as table_schema
from models import table as table_model
from models import order as order_model
from models.user import User
from database import SessionLocal
from utils.auth import require_roles


router = APIRouter(prefix="/tables", tags=["Tables"])


ACTIVE_ORDER_STATUSES = ["pending", "in_progress", "ready", "delivered"]

ADMIN_ONLY = ["admin"]
TABLE_READ_ROLES = ["admin", "waiter", "cashier"]
TABLE_STATUS_ROLES = ["admin", "waiter"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=table_schema.Table)
def create_table(
    table_data: table_schema.TableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    existing_table = db.query(table_model.Table).filter(
        table_model.Table.number == table_data.number
    ).first()

    if existing_table:
        raise HTTPException(status_code=400, detail="Table number already exists")

    db_table = table_model.Table(**table_data.model_dump())

    db.add(db_table)
    db.commit()
    db.refresh(db_table)

    return db_table


@router.get("/", response_model=list[table_schema.Table])
def get_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(TABLE_READ_ROLES)),
):
    return db.query(table_model.Table).all()


@router.get("/{table_id}", response_model=table_schema.Table)
def get_table_by_id(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(TABLE_READ_ROLES)),
):
    db_table = db.query(table_model.Table).filter(
        table_model.Table.id == table_id
    ).first()

    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    return db_table


@router.put("/{table_id}", response_model=table_schema.Table)
def update_table(
    table_id: int,
    updated_data: table_schema.TableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    db_table = db.query(table_model.Table).filter(
        table_model.Table.id == table_id
    ).first()

    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    existing_table = db.query(table_model.Table).filter(
        table_model.Table.number == updated_data.number,
        table_model.Table.id != table_id,
    ).first()

    if existing_table:
        raise HTTPException(status_code=400, detail="Table number already exists")

    db_table.number = updated_data.number
    db_table.status = updated_data.status

    db.commit()
    db.refresh(db_table)

    return db_table


@router.patch("/{table_id}/status", response_model=table_schema.Table)
def update_table_status_only(
    table_id: int,
    data: table_schema.TableStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(TABLE_STATUS_ROLES)),
):
    db_table = db.query(table_model.Table).filter(
        table_model.Table.id == table_id
    ).first()

    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    db_table.status = data.status

    db.commit()
    db.refresh(db_table)

    return db_table


@router.delete("/{table_id}", status_code=204)
def delete_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    db_table = db.query(table_model.Table).filter(
        table_model.Table.id == table_id
    ).first()

    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    active_order = db.query(order_model.Order).filter(
        order_model.Order.table_id == table_id,
        order_model.Order.status.in_(ACTIVE_ORDER_STATUSES),
    ).first()

    if active_order:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a table with an active order",
        )

    try:
        db.delete(db_table)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this table because it may have related orders",
        )