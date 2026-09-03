from datetime import datetime, timedelta, timezone
from typing import Annotated, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from sql import get_session

from models.Ticket import Ticket
from models.Table import Table
from models.Product import Product
from models.User import User, UserRoles
from models.OrderItem import OrderItem, OrderItemPost, OrderItemPatch, OrderItemPublic
from models.GuestSession import GuestSession


# Frontend'den gelecek lock/unlock payload'ı
class LockRequest(BaseModel):
    guest_id: uuid.UUID
    lock: bool


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


@router.get("/ticket/{ticket_id}", response_model=List[OrderItemPublic])
def get_orders_by_ticket_id(ticket_id: int, session: SessionDep):
    db_orders = session.exec(
        select(OrderItem).where(OrderItem.ticket_id == ticket_id)
    ).all()
    if not db_orders:
        return []

    return db_orders


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
            id=None,  # Will be assigned by sql
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


# @router.post("/{guest_id}", response_model=OrderItemPublic)
# def create_order_item_by_guest(guest_id: uuid.UUID, order_in: OrderItemPost,):

#     pass


# Endpoint for LOCKING an orderItem.
# TODO: PREVENT GUESTS FROM INTERVENING OTHERS ORDER ITEMS!!!
# Returns: {
#    ticket_id: ,
#    product_id,
#    id,          #orderItem's id
#    added_at,
# }
@router.patch("/{item_id}/lock", response_model=OrderItemPublic)
def toggle_item_lock(item_id: int, payload: LockRequest, session: SessionDep):
    db_item = session.get(OrderItem, item_id)

    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sipariş bulunamadı!"
        )

    if db_item.is_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Ödenmiş ürün kilitlenemez!"
        )

    if payload.lock:
        # KİLİTLEME İŞLEMİ (Zar Atma)
        # Eğer ürün başkası tarafından kilitlenmişse ve süresi henüz dolmadıysa: 409 Conflict fırlat
        if (
            db_item.locked_by_session_id is not None
            and db_item.locked_by_session_id != payload.guest_id
            and db_item.locked_until is not None
            and db_item.locked_until > datetime.now(timezone.utc)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu ürün şu anda başka bir müşteri tarafından kilitlenmiş.",
            )

        # Kilidi atan misafirin bilgilerini bul (Ekranda ismini göstermek için)
        guest = session.get(GuestSession, payload.guest_id)
        if not guest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Misafir oturumu bulunamadı!",
            )

        # Kendi üzerine kilitle (15 dakika süre tanı)
        db_item.locked_by_session_id = guest.id
        db_item.locked_by_name = guest.guest_name
        db_item.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)

    else:
        # KİLİT AÇMA İŞLEMİ (Vazgeçme)
        # Sadece ürünü kilitleyen kişi kilidi kaldırabilir
        if db_item.locked_by_session_id == payload.guest_id:
            db_item.locked_by_session_id = None
            db_item.locked_by_name = None
            db_item.locked_until = None
        elif db_item.locked_by_session_id is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sadece ürünü kilitleyen kişi kilidi açabilir.",
            )

    session.add(db_item)
    session.commit()
    session.refresh(db_item)

    return db_item


@router.patch("/{item_id}", response_model=OrderItemPublic)
def update_order_item(item_id: int, item_update: OrderItemPatch, session: SessionDep):
    db_item = session.get(OrderItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Order item not found!")

    # --- 1. THE SOFT LOCK CHECK ---
    # If the incoming request is trying to lock the item (locked_by_session is not None)
    if item_update.locked_by_session is not None:

        # If it is already locked by someone else AND the lock hasn't expired yet
        if (
            db_item.locked_by_session_id is not None
            and db_item.locked_by_session_id != item_update.locked_by_session
            and db_item.locked_until is not None
            and db_item.locked_until > datetime.now(timezone.utc)
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
