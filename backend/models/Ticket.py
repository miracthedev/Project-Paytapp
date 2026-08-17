from typing import TYPE_CHECKING, Optional, List
from datetime import datetime, timezone
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from backend.models.Table import Table
    from backend.models.OrderItem import OrderItem

# 1. Ortak (Base) Sınıf
class TicketBase(SQLModel):
    table_id: int = Field(foreign_key="table.id")
    is_active: bool = Field(default=True)

# 2. Veritabanı Modeli (Table)
class Ticket(TicketBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    opened_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    closed_at: Optional[datetime] = None
    
    # İlişkiler (Relationships)
    dining_table: Optional["Table"] = Relationship(back_populates="tickets")
    order_items: List["OrderItem"] = Relationship(back_populates="ticket")

# 3. Girdi Modeli (POST) - Sadece adisyon açmak için gerekenler
class TicketPost(TicketBase):
    pass # table_id ve is_active (varsayılan True) TicketBase'den gelir

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