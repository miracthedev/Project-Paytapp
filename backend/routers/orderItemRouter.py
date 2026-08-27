from datetime import datetime, timezone
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from models.Product import Product
from models.User import User, UserRoles
from models.OrderItem import OrderItem, OrderItemPost, OrderItemPatch, OrderItemPublic
from sql import get_session

# Garsonların da sipariş girebilmesi için genel yetkilendirme (giriş yapmış olmak yeterli)
from auth import get_current_user

router = APIRouter(
    prefix="/order-items",
    tags=["Order Item"],
)

# Used for getting the Database session! not the user session..
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/", response_model=List[OrderItemPublic])
def get_all_order_items(session: SessionDep):
    exists_order_items = session.exec(select(OrderItem)).all()
    if not exists_order_items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No Ordered Items found!"
        )
    return exists_order_items


@router.get("/{item_id}", response_model=OrderItemPublic)
def get_order_item(item_id: int, session: SessionDep):
    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")
    return db_item


@router.post("/", response_model=OrderItemPublic, status_code=status.HTTP_201_CREATED)
def create_order_item(item_in: OrderItemPost, session: SessionDep):
    # 1. Önce ürünün gerçek fiyatını veritabanından bul
    product = session.get(Product, item_in.product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ürün bulunamadı!",
        )

    # 2. Fiyatı ve ismi backend kendisi doldursun
    try:
        db_item = OrderItem(
            ticket_id=item_in.ticket_id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
            note=item_in.note,
            sh_product_name=product.name,
            sh_price_singular=product.price,
            image_url=product.image_url,
        )

        session.add(db_item)
        session.commit()
        session.refresh(db_item)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Creation of Order failed: {str(e)}",
        )
    return db_item


@router.patch("/{item_id}", response_model=OrderItemPublic)
def update_order_item(item_id: int, item_update: OrderItemPatch, session: SessionDep):
    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")

    # --- 1. THE SOFT LOCK CHECK ---
    # If the incoming request is trying to lock the item (locked_by_session is not None)
    if item_update.locked_by_session is not None:
        now = datetime.now(timezone.utc)

        # If it is already locked by someone else AND the lock hasn't expired yet
        if (
            db_item.locked_by_session is not None
            and db_item.locked_by_session != item_update.locked_by_session
            and db_item.locked_until is not None
            and db_item.locked_until > now
        ):
            # Block the request! This throws the error your Next.js catch block is looking for.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Item is already locked by another user.",
            )
    # ------------------------------

    update_data = item_update.model_dump(exclude_unset=True)
    db_item.sqlmodel_update(update_data)

    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_item(
    item_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),  # <- JWT Token ZORUNLU
):
    # 3. Rol Kontrolü: Gelen kişi Müşteri mi yoksa yetkili mi?
    if current_user.role not in [UserRoles.ADMIN, UserRoles.WAITER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlemi yapmak için Garson veya Yönetici yetkisine sahip olmalısınız.",
        )

    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")

    session.delete(db_item)
    session.commit()
    return None
