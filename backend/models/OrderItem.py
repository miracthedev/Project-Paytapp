from typing import TYPE_CHECKING, Optional
from datetime import datetime, timezone
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from backend.models.Ticket import Ticket

class OrderItemBase(SQLModel):
    ticket_id: int = Field(foreign_key="ticket.id")
    product_name: str 
    price: float
    
    # Soft Lock & Ödeme Durumu
    is_paid: bool = Field(default=False)
    paid_by_session: Optional[str] = None
    locked_by_session: Optional[str] = None
    locked_until: Optional[datetime] = None

class OrderItem(OrderItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    ticket: Optional["Ticket"] = Relationship(back_populates="order_items")

class OrderItemPost(SQLModel):
    # Yeni bir sipariş eklerken kilit veya ödeme bilgisi gönderilmez! Sadece temel bilgiler.
    ticket_id: int
    product_name: str
    price: float

class OrderItemPatch(SQLModel):
    is_paid: Optional[bool] = None
    paid_by_session: Optional[str] = None
    locked_by_session: Optional[str] = None
    locked_until: Optional[datetime] = None

class OrderItemPublic(OrderItemBase):
    id: int
    added_at: datetime