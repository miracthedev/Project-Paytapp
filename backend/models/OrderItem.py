from decimal import Decimal
from typing import TYPE_CHECKING, Annotated, Optional
from datetime import datetime, timezone
import uuid
from pydantic import computed_field
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models.Ticket import Ticket
    from models.Product import Product
    from models.GuestSession import GuestSession


class OrderItemBase(SQLModel):
    """
    **Örnek Kullanım:**
    ```
    {
        "ticket_id": 4,
        "[product_id]": 126,
        "sh_product_name": "kebap",
        "sh_price_singular": Decimal("3.21") #default=None
        "[note]": "acılı olsun brom",
        "quantity": 2, #default=1, ge=1, nullable=False
        "[image_url]": "some/image.png", #default=None
        "is_paid": False, #default=False
        "[paid_by_session_id]": someUUID...,
        "[paid_by_name]": "Misafir 4",
        "[locked_by_session_id]": someAnotherUUID..., #default=None
        "[locked_by_name]": "Misafir 5", #default=None
        "[locked_until]": 2026-09-02 14:30:002134, #default=None

        @computated_field
        "sh_price_total" = sh_price_singular * quantity, #default=Decimal("0.0")
    }
    ```
    """

    ticket_id: int = Field(foreign_key="ticket.id")
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")

    sh_product_name: str
    sh_price_singular: Decimal = Field(ge=0.0, max_digits=10, decimal_places=2)

    note: Optional[str] = None
    quantity: int = Field(default=1, ge=1, nullable=False)
    image_url: Optional[str] = None
    intended_payment_method: Optional[str] = None
    status: str = Field(default="CART")

    is_paid: bool = Field(default=False)
    paid_by_session_id: Optional[uuid.UUID] = None
    locked_by_session_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="guestsession.id"
    )
    locked_until: Optional[datetime] = None

    locked_by_name: Optional[str] = None
    paid_by_name: Optional[str] = None

    @computed_field
    @property
    def sh_price_total(self) -> Decimal:
        if self.sh_price_singular and self.quantity:
            return self.sh_price_singular * self.quantity
        return Decimal("0.0")


class OrderItem(OrderItemBase, table=True):
    """
    ```**Örnek JSON**
    {
        ...OrderItemBase,
        "id": 5, #pk=True
        "added_at": 2026-09-02 14:30:002134 #default=datetime.now()
    }
    ```
    """

    id: Optional[int] = Field(primary_key=True)
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    ticket: Optional["Ticket"] = Relationship(back_populates="items")
    locked_by_guest: Optional["GuestSession"] = Relationship(
        back_populates="locked_items"
    )


class OrderItemPost(SQLModel):
    """
    ```Örnek JSON
    {
        "ticket_id": 2,
        "product_id": 1902,
        "[note]": "Sade olsun",
        "quantity": 4, #default=1, nullable=False
        "guest_id": someUUID...,
    }
    ```
    """

    ticket_id: int
    product_id: int
    note: Optional[str] = None
    quantity: int = Field(default=1, ge=1, nullable=False)
    guest_id: uuid.UUID
    status: str = Field(default="CART")


class OrderItemPatch(SQLModel):
    """
    ```Örnek JSON
    #ALL DEFAULT TO NONE
    {
        [is_paid]: True,
        [note]: "Çikolatası bol olsun",
        [quantity]: 23,
        [paid_by_session_id]: someSessionId...,
        [locked_by_session]: someSessionId...,
        [locked_until]: 2026-09-02 14:30:002134,
        [image_url]: some/image.png,
    }
    ```
    """

    is_paid: Optional[bool] = None
    note: Optional[str] = None
    quantity: Optional[int] = None
    paid_by_session_id: Optional[uuid.UUID] = None
    locked_by_session: Optional[uuid.UUID] = None
    locked_until: Optional[datetime] = None
    image_url: Optional[str] = None
    intended_payment_method: Optional[str] = None
    status: str = Field(default="CART")


class OrderItemPublic(OrderItemBase):
    """
    ```Örnek JSON
    {
        ...OrderItemBase,
        "id": 421,
        "added_at": 2026-09-02 14:30:002134
    }
    ```
    """

    id: int
    added_at: datetime
