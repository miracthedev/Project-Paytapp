from decimal import Decimal
from typing import TYPE_CHECKING, Annotated, Optional
from datetime import datetime, timezone
from pydantic import computed_field
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models.Ticket import Ticket


class OrderItemBase(SQLModel):
    ticket_id: int = Field(foreign_key="ticket.id")

    # 1. The Relationship (Optional, in case the product is deleted from the menu later)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")

    # 2. The Snapshot (Historical record that NEVER changes)
    sh_product_name: str
    sh_price_singular: Annotated[
        Decimal, Field(None, ge=0.0, max_digits=10, decimal_places=2)
    ]

    note: Optional[str] = None
    quantity: int = Field(default=1, ge=1, nullable=False)
    image_url: Optional[str] = None

    # Soft Lock & Ödeme Durumu
    is_paid: bool = Field(default=False)
    paid_by_session: Optional[str] = None
    locked_by_session: Optional[str] = None
    locked_until: Optional[datetime] = None

    # Kilit & Ödeme Yapan Kişinin Görünür Adı (Snapshot - Frontend için)
    locked_by_name: Optional[str] = None
    paid_by_name: Optional[str] = None

    # Calculate total on the fly (Not stored in the DB)
    @computed_field
    def sh_price_total(self) -> Decimal:
        if self.sh_price_singular and self.quantity:
            return self.sh_price_singular * self.quantity
        return Decimal("0.0")


class OrderItem(OrderItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    ticket: Optional["Ticket"] = Relationship(back_populates="order_items")


class OrderItemPost(SQLModel):
    # Yeni bir sipariş eklerken kilit veya ödeme bilgisi gönderilmez! Sadece temel bilgiler.
    ticket_id: int
    product_id: int
    note: Optional[str]
    quantity: int = Field(default=1, ge=1, nullable=False)


class OrderItemPatch(SQLModel):
    is_paid: Optional[bool] = None
    note: Optional[str] = None
    quantity: Optional[int] = None
    paid_by_session: Optional[str] = None
    locked_by_session: Optional[str] = None
    locked_until: Optional[datetime] = None
    image_url: Optional[str] = None


class OrderItemPublic(OrderItemBase):
    id: int
    added_at: datetime
