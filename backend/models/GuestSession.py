from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional, List
import uuid
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from models.Ticket import Ticket
    from models.OrderItem import OrderItem


# Base model for our Guest Session. incl.: ticket_id, guest_name. these are optional as they will be produces on go.
class GuestSessionBase(SQLModel):
    """
    **Örnek Kullanım:**
    ```
    {
        "[ticket_id]": 3 | None,
        "[guest_name]": "Misafir 11", #default="Misafir"
    }
    ```
    """

    ticket_id: Optional[int] = Field(foreign_key="ticket.id")
    guest_name: Optional[str] = Field(default="Misafir")


# Now, this class will actually saved for database. It inherits from Base guest session.
class GuestSession(GuestSessionBase, table=True):
    """
    **Örnek Kullanım:**
    ```
    {
        "[ticket_id]": 3 | None,
        "[guest_name]": "Misafir 11",  #default="Misafir"
        "id": fda9972c8cce44..., #default=uuid.uuid4,
        "joined_at": 2026-09-02 14:30:002134, #default=datetime.now(timezone.utc),
        "is_active": True #default=True,

    }
    ```
    """

    # It's not optional. will be generated if not given by frontend.
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # a datetime that shows when this guest has been joined to the table.
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Used as deletion alternative. keeping it as a log of what happened when
    is_active: bool = Field(default=True)

    # RELATIONSHIPS
    ticket: Optional["Ticket"] = Relationship(back_populates="guests")
    locked_items: List["OrderItem"] = Relationship(back_populates="locked_by_guest")


# Post class (create). ticket_id and guest_name are NOT Optional.
class GuestSessionPost(SQLModel):
    """
    **Örnek Kullanım:**
    ```
    {
        "ticket_id": 3 | None,
        "guest_name": "Misafir 11", #default="Misafir"
    }
    ```
    """

    ticket_id: int
    guest_name: str = "Misafir"


# Patch class (update). params are optional, as maybe user won't change it at all!.
class GuestSessionPatch(SQLModel):
    """
    **Örnek Kullanım:**
    ```
    {
        "[ticket_id]": 3 | None,
        "[is_active]": True | None
    }
    ```
    """

    guest_name: Optional[str]
    is_active: Optional[bool]


# Return class.
class GuestSessionPublic(GuestSessionBase):
    """
    **Örnek Kullanım:**
    ```
    {
        "[ticket_id]": 3 | None,
        "[guest_name]": "Misafir 11",  #default="Misafir"
        "id": fda9972c8cce44...,
        "joined_at": 2026-09-02 14:30:002134
    }
    ```
    """

    id: uuid.UUID
    joined_at: datetime


"""
These above classes are used in OrderItem and Ticket routers.

"""
