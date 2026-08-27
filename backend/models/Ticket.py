from typing import TYPE_CHECKING, Optional, List
from datetime import datetime, timezone
from pydantic import computed_field
from sqlmodel import Field, Relationship, SQLModel
from models.OrderItem import OrderItem
from models.OrderItem import OrderItemPublic

if TYPE_CHECKING:
    from models.Table import Table
    from models.User import User


# 1. Ortak (Base) Sınıf
class TicketBase(SQLModel):
    table_id: int = Field(foreign_key="table.id")
    is_active: bool = Field(default=True)
    waiter_id: Optional[int] = Field(default=None, foreign_key="user.id")


# 2. Veritabanı Modeli (Table)
class Ticket(TicketBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None

    # İlişkiler (Relationships)
    table: Optional["Table"] = Relationship(back_populates="tickets")
    responsible_waiter: Optional["User"] = Relationship(back_populates="tickets")
    order_items: List["OrderItem"] = Relationship(back_populates="ticket")
    items: List["OrderItem"] = Relationship(back_populates="ticket")

    @computed_field
    def grand_total(self) -> float:
        # Sums up the 'sh_price_total' of every item attached to this ticket
        return sum(item.sh_price_total for item in self.items)


# 3. Girdi Modeli (POST) - Sadece adisyon açmak için gerekenler
class TicketPost(TicketBase):
    pass  # table_id ve is_active (varsayılan True) TicketBase'den gelir


# 4. Güncelleme Modeli (PATCH) - Tüm alanlar Optional olmalı!
class TicketPatch(SQLModel):
    table_id: Optional[int] = None
    is_active: Optional[bool] = None
    closed_at: Optional[datetime] = None


# 5. Çıktı Modeli (Public) - Frontend'e dönen veri
class TicketPublic(TicketBase):
    id: int
    opened_at: datetime
    closed_at: Optional[datetime] = None


# 6. Genişletilmiş Çıktı Modeli - Frontend'e adisyonu ve içindeki tüm ürünleri tek seferde döner
class TicketPublicWithItems(TicketPublic):
    order_items: List[OrderItemPublic] = []


TicketPublicWithItems.model_rebuild()
