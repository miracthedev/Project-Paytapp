from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from backend.models.Restaurant import Restaurant


#CLASSES
#TODO: add image upload functionality
class ProductBase(SQLModel):
    restaurant_id: int = Field(foreign_key="restaurant.id")
    name: str
    category: str
    price: float
    is_active: bool = Field(default=True)
    # image: str | None = Field(default=None)

class Product(ProductBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    restaurant: Optional["Restaurant"] = Relationship(back_populates="products")

class ProductPost(ProductBase):
    pass # Frontend'den yeni ürün eklerken Base'deki her şeyi isteriz

class ProductPatch(SQLModel):
    # Tüm alanlar Optional olmalı ki sadece güncellenen değerler gelsin
    restaurant_id: Optional[int] = None
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None
    image: str | None = Field(default=None)

class ProductPublic(ProductBase):
    id: int