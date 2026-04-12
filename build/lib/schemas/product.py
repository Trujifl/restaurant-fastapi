from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name is required")
    price: float = Field(..., gt=0, description="Price must be greater than 0")
    category: str | None = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    price: float | None = Field(default=None, gt=0)
    category: str | None = None

class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True

