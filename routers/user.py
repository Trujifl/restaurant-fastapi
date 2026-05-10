from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal
from models.user import User
from models import order as order_model
from schemas.user import UserCreate, UserResponse, UserUpdate
from utils.security import hash_password
from utils.auth import require_roles


router = APIRouter(prefix="/users", tags=["Users"])


ALLOWED_ROLES = ["admin", "waiter", "kitchen", "cashier"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    if user_data.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing_user = db.query(User).filter(User.email == user_data.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return db_user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.email is not None:
        existing_user = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id,
        ).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        db_user.email = user_data.email

    if user_data.name is not None:
        db_user.name = user_data.name

    if user_data.role is not None:
        if user_data.role not in ALLOWED_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")

        db_user.role = user_data.role

    if user_data.is_active is not None:
        db_user.is_active = user_data.is_active

    if user_data.password is not None and user_data.password.strip():
        db_user.hashed_password = hash_password(user_data.password)

    db.commit()
    db.refresh(db_user)

    return db_user


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.is_active = is_active

    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own admin account",
        )

    related_order = db.query(order_model.Order).filter(
        order_model.Order.user_id == user_id
    ).first()

    if related_order:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this user because they have related orders. Deactivate the user instead.",
        )

    db.delete(db_user)
    db.commit()