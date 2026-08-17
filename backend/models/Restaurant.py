from typing import TYPE_CHECKING, List, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models.Table import Table
    from models.Product import Product
    from models.User import User

# 1. Ortak (Base) Sınıf: Herkese açık ve ortak olan temel alanlar
class RestaurantBase(SQLModel):
    name: str
    location: str | None = None
    is_active: bool = Field(default=True)

# 2. Veritabanı Modeli (Table): Gizli veriler ve DB ilişkileri sadece buradadır
class Restaurant(RestaurantBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # DİKKAT: iyzico_key Base sınıftan çıkarıldı, sadece DB'de tutuluyor
    iyzico_key: str | None = Field(default=None, unique=True)
    
    # İlişkiler
    tables: List["Table"] = Relationship(back_populates="restaurant")
    products: List["Product"] = Relationship(back_populates="restaurant")
    staff: List["User"] = Relationship(back_populates="restaurant")

# 3. Girdi Modeli (POST): Yeni kayıt açılırken API anahtarı da girilebilsin
class RestaurantPost(RestaurantBase):
    iyzico_key: str | None = None

# 4. Güncelleme Modeli (PATCH): Tüm alanlar isteğe bağlı (Optional) olmalıdır
class RestaurantPatch(SQLModel):
    name: Optional[str] = None
    location: Optional[str] = None
    iyzico_key: Optional[str] = None
    is_active: Optional[bool] = None

# 5. Çıktı Modeli (Public): Frontend'e dönen GÜVENLİ veri
class RestaurantPublic(RestaurantBase):
    id: int
    # iyzico_key burada bilerek YOK. Böylece endpoint response_model olarak 
    # RestaurantPublic kullandığında, API'nizden asla gizli anahtar sızmayacaktır.