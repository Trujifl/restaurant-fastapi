import os

from sqlalchemy.orm import Session

from models.user import User
from utils.security import hash_password


DEFAULT_ADMIN_NAME = os.getenv("DEFAULT_ADMIN_NAME", "Admin")
DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@restaurant.com")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "123456")


def create_default_admin(db: Session):
    existing_admin = db.query(User).filter(
        User.email == DEFAULT_ADMIN_EMAIL
    ).first()

    if existing_admin:
        return existing_admin

    admin_user = User(
        name=DEFAULT_ADMIN_NAME,
        email=DEFAULT_ADMIN_EMAIL,
        hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
        role="admin",
        is_active=True,
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    return admin_user