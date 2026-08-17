from typing import TYPE_CHECKING, Optional, List
from sqlmodel import Field, Relationship, SQLModel
from enum import StrEnum, auto

if TYPE_CHECKING:
    from backend.models.Restaurant import Restaurant
    from backend.models.Ticket import Ticket

class TableRegion(StrEnum):
    MAIN = auto()
    TERRACE = auto()

class TableType(StrEnum):
    DINING_LONG = auto()
    DINING_SHORT = auto()
    STOOL = auto()

class TableBase(SQLModel):
    restaurant_id: int = Field(foreign_key="restaurant.id")
    table_name: str
    floor: int
    region: TableRegion
    type: TableType
    is_occupied: bool = Field(default=False)
    # qr_hash eklenebilir

class Table(TableBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    restaurant: Optional["Restaurant"] = Relationship(back_populates="tables")
    tickets: List["Ticket"] = Relationship(back_populates="dining_table")

class TablePost(TableBase):
    pass

class TablePatch(SQLModel):
    restaurant_id: Optional[int] = None
    table_name: Optional[str] = None
    floor: Optional[int] = None
    region: Optional[TableRegion] = None
    type: Optional[TableType] = None
    is_occupied: Optional[bool] = None

class TablePublic(TableBase):
    id: int