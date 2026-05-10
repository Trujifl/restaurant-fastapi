from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import SessionLocal
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse, LoginResponse
from utils.security import hash_password, verify_password, create_access_token


router = APIRouter(prefix="/auth", tags=["auth"])


ALLOWED_ROLES = ["admin", "waiter", "kitchen", "cashier"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def authenticate_user(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user


def build_login_response(user: User):
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.role,
            "user_id": user.id,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=403,
        detail="Public registration is disabled. Users must be created by an admin.",
    )


@router.post("/login", response_model=LoginResponse)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(
        email=user_credentials.email,
        password=user_credentials.password,
        db=db,
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return build_login_response(user)


@router.post("/token")
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        email=form_data.username,
        password=form_data.password,
        db=db,
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    login_response = build_login_response(user)

    return {
        "access_token": login_response["access_token"],
        "token_type": login_response["token_type"],
    }