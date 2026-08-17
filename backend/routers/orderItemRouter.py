from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sql import get_session
# Garsonların da sipariş girebilmesi için genel yetkilendirme (giriş yapmış olmak yeterli)
from auth import get_current_user 

from models.OrderItem import OrderItem, OrderItemPost, OrderItemPatch, OrderItemPublic

router = APIRouter(
    prefix="/order-items",
    tags=["Order Item"],
    dependencies=[Depends(get_current_user)]
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/", response_model=List[OrderItemPublic])
def get_all_order_items(session: SessionDep):
    return session.exec(select(OrderItem)).all()

@router.get("/{item_id}", response_model=OrderItemPublic)
def get_order_item(item_id: int, session: SessionDep):
    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")
    return db_item

@router.post("/", response_model=OrderItemPublic, status_code=status.HTTP_201_CREATED)
def create_order_item(item_in: OrderItemPost, session: SessionDep):
    db_item = OrderItem.model_validate(item_in)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.patch("/{item_id}", response_model=OrderItemPublic)
def update_order_item(item_id: int, item_update: OrderItemPatch, session: SessionDep):
    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")
    
    update_data = item_update.model_dump(exclude_unset=True)
    db_item.sqlmodel_update(update_data)
        
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_item(item_id: int, session: SessionDep):
    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")
    
    session.delete(db_item)
    session.commit()
    return None