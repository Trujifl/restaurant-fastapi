from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import table as table_schema
from models import table as table_model
from database import SessionLocal

router = APIRouter(prefix="/tables", tags=["Tables"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=table_schema.Table)
def create_table(table_data: table_schema.TableCreate, db: Session = Depends(get_db)):
    existing = db.query(table_model.Table).filter(table_model.Table.number == table_data.number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")
    db_table = table_model.Table(**table_data.dict())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

@router.get("/", response_model=list[table_schema.Table])
def get_tables(db: Session = Depends(get_db)):
    return db.query(table_model.Table).all()

@router.get("/{table_id}", response_model=table_schema.Table)
def get_table_by_id(table_id: int, db: Session = Depends(get_db)):
    db_table = db.query(table_model.Table).filter(table_model.Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_table

@router.put("/{table_id}", response_model=table_schema.Table)
def update_table_status(table_id: int, updated_data: table_schema.TableCreate, db: Session = Depends(get_db)):
    db_table = db.query(table_model.Table).filter(table_model.Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    db_table.number = updated_data.number
    db_table.status = updated_data.status

    db.commit()
    db.refresh(db_table)
    return db_table

@router.patch("/{table_id}/status", response_model=table_schema.Table)
def update_table_status_only(table_id: int, data: table_schema.TableStatusUpdate, db: Session = Depends(get_db)):
    db_table = db.query(table_model.Table).filter(table_model.Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    db_table.status = data.status
    db.commit()
    db.refresh(db_table)
    return db_table