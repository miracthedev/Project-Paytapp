import random
import string
from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, Relationship, SQLModel
from enum import StrEnum, auto

if TYPE_CHECKING:
    from backend.models.Restaurant import Restaurant
    from backend.models.Ticket import Ticket


# Yardımcı Fonksiyon: 5 haneli rastgele alfanümerik kod üretir
# TEST İCİN!!
def generate_nfc_code() -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=5))


# ENUMS
class TableRegion(StrEnum):
    MAIN = auto()
    TERRACE = auto()


class TableType(StrEnum):
    DINING_LONG = auto()
    DINING_SHORT = auto()
    STOOL = auto()


# TABLE CLASSES
class TableBase(SQLModel):
    restaurant_id: int = Field(foreign_key="restaurant.id")
    table_name: str
    floor: int
    region: TableRegion
    type: TableType
    is_occupied: bool = Field(default=False)
    nfc_code: str = Field(
        default_factory=generate_nfc_code, max_length=5, unique=True, index=True
    )


class Table(TableBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    restaurant: Optional["Restaurant"] = Relationship(back_populates="tables")
    tickets: List["Ticket"] = Relationship(back_populates="table")


class TablePost(TableBase):
    pass


class TablePatch(SQLModel):
    restaurant_id: Optional[int] = None
    table_name: Optional[str] = None
    floor: Optional[int] = None
    region: Optional[TableRegion] = None
    type: Optional[TableType] = None
    is_occupied: Optional[bool] = None
    nfc_code: Optional[str] = Field(default=None, max_length=5)


class TablePublic(TableBase):
    id: int
