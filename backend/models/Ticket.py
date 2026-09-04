from typing import TYPE_CHECKING, Optional, List, cast
from datetime import datetime, timezone
from decimal import Decimal  # <-- EKLENDİ
from pydantic import computed_field
from sqlmodel import Field, Relationship, SQLModel
from models.GuestSession import GuestSession
from models.OrderItem import OrderItem
from models.OrderItem import OrderItemPublic

if TYPE_CHECKING:
    from models.Table import Table
    from models.User import User


# 1. Ortak (Base) Sınıf
class TicketBase(SQLModel):
    table_id: Optional[int] = Field(foreign_key="table.id")
    is_active: Optional[bool] = Field(default=True)
    waiter_id: Optional[int] = Field(default=None, foreign_key="user.id")
    confirmation_started_at: Optional[datetime] = None


# 2. Veritabanı Modeli (Table)
class Ticket(TicketBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None

    # İlişkiler (Relationships)
    table: Optional["Table"] = Relationship(back_populates="tickets")
    responsible_waiter: Optional["User"] = Relationship(back_populates="tickets")

    # DÜZELTME: Çakışmayı önlemek için 'order_items' silindi, sadece 'items' bırakıldı
    items: List["OrderItem"] = Relationship(back_populates="ticket")
    guests: List["GuestSession"] = Relationship(back_populates="ticket")

    # DÜZELTME: Dönüş tipi Decimal yapıldı ve sum() içine başlangıç değeri eklendi
    @computed_field
    @property
    def grand_total(self) -> Decimal:
        total = Decimal("0.00")
        for item in self.items:
            total += cast(Decimal, item.sh_price_total)
        return total


# 3. Girdi Modeli (POST)
class TicketPost(TicketBase):
    pass


# 4. Güncelleme Modeli (PATCH)
class TicketPatch(SQLModel):
    table_id: Optional[int] = None
    is_active: Optional[bool] = None
    closed_at: Optional[datetime] = None
    confirmation_started_at: Optional[datetime] = None


# 5. Çıktı Modeli (Public)
class TicketPublic(TicketBase):
    id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None
    confirmation_started_at: Optional[datetime] = None


# 6. Genişletilmiş Çıktı Modeli
class TicketPublicWithItems(TicketPublic):
    # DÜZELTME: Veritabanı modeliyle eşleşmesi için burası da 'items' yapıldı
    items: List[OrderItemPublic] = []


TicketPublicWithItems.model_rebuild()
