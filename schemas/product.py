from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name is required")
    price: float = Field(..., gt=0, description="Price must be greater than 0")
    category: str | None = None


class ProductCreate(ProductBase):
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    price: float | None = Field(default=None, gt=0)
    category: str | None = None
    is_active: bool | None = None


class Product(ProductBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)