from typing import TYPE_CHECKING, Optional
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from enum import StrEnum, auto

if TYPE_CHECKING:
    from backend.models.Restaurant import Restaurant

class UserRoles(StrEnum):
    ADMIN = auto()
    WAITER = auto()

# 1. Ortak (Base) Sınıf: Her yerde kullanılacak temel alanlar
class UserBase(SQLModel):
    restaurant_id: int = Field(foreign_key="restaurant.id")
    email: EmailStr = Field(unique=True)
    username: str = Field(index=True)
    role: UserRoles = Field(default=UserRoles.WAITER)
    is_active: bool = Field(default=True)  # YENİ: Kullanıcıyı silmek yerine pasife almak için

# 2. Veritabanı Modeli (Table): Sadece veritabanında olacak ekstra alanlar
class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    
    restaurant: Optional["Restaurant"] = Relationship(back_populates="staff")

# 3. Girdi Modeli (Post/Create): Müşteriden (Frontend'den) beklediğimiz veri
class UserPost(UserBase):
    password: str  # Frontend saf şifreyi gönderir, backend bunu hashleyip 'User' objesine çevirir

# 4. Güncelleme Modeli (Patch): YENİ EKLENDİ - Kullanıcı bilgilerini güncellemek için
class UserPatch(SQLModel):
    # Tüm alanlar Optional olmalı ki sadece değiştirilmek istenen değerler gönderilsin
    restaurant_id: Optional[int] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[UserRoles] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Kullanıcı şifresini değiştirmek isterse

# 5. Çıktı Modeli (Response/Public): Frontend'e geri döneceğimiz güvenli veri
class UserPublic(UserBase):
    id: int
    # Dikkat: Şifre alanı (ne saf ne de hashli hali) burada yer almaz, böylece API'den şifre sızmaz.

# =================================================================
# AUTH.PY İLE HABERLEŞECEK YENİ ŞEMALAR
# =================================================================

# 6. Giriş (Login) Şeması: Frontend'den sadece email ve şifre bekleriz
class UserLogin(SQLModel):
    email: EmailStr
    password: str

# 7. Token Yanıt Şeması: Başarılı giriş sonrası frontend'e döneceğimiz JWT yapısı
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

# 8. Token Payload Şeması: JWT içindeki (decode edilmiş) veriyi doğrulamak için
class TokenPayload(SQLModel):
    sub: Optional[str] = None
    exp: Optional[int] = None