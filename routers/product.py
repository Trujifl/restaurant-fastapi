from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import product as product_model
from models.user import User
from schemas import product as product_schema
from utils.auth import require_roles


router = APIRouter(prefix="/products", tags=["Products"])


ALL_ROLES = ["admin", "waiter", "kitchen", "cashier"]
ADMIN_ONLY = ["admin"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=product_schema.Product)
def create_product(
    product: product_schema.ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    db_product = product_model.Product(**product.model_dump())

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


@router.get("/", response_model=list[product_schema.Product])
def get_products(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ALL_ROLES)),
):
    query = db.query(product_model.Product)

    if active_only or current_user.role != "admin":
        query = query.filter(product_model.Product.is_active == True)

    return query.order_by(product_model.Product.id.asc()).all()


@router.get("/{product_id}", response_model=product_schema.Product)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ALL_ROLES)),
):
    product = db.query(product_model.Product).filter(
        product_model.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.put("/{product_id}", response_model=product_schema.Product)
def update_product(
    product_id: int,
    updated_data: product_schema.ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    product = db.query(product_model.Product).filter(
        product_model.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.name = updated_data.name
    product.price = updated_data.price
    product.category = updated_data.category
    product.is_active = updated_data.is_active

    db.commit()
    db.refresh(product)

    return product


@router.patch("/{product_id}", response_model=product_schema.Product)
def patch_product(
    product_id: int,
    patch_data: product_schema.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    product = db.query(product_model.Product).filter(
        product_model.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if patch_data.name is not None:
        product.name = patch_data.name

    if patch_data.price is not None:
        product.price = patch_data.price

    if patch_data.category is not None:
        product.category = patch_data.category

    if patch_data.is_active is not None:
        product.is_active = patch_data.is_active

    db.commit()
    db.refresh(product)

    return product


@router.patch("/{product_id}/status", response_model=product_schema.Product)
def update_product_status(
    product_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    product = db.query(product_model.Product).filter(
        product_model.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = is_active

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ADMIN_ONLY)),
):
    product = db.query(product_model.Product).filter(
        product_model.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False

    db.commit()