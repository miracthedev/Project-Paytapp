from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from models.GuestSession import GuestSession
from models.Ticket import Ticket
from sql import get_session
from auth import require_role
from models.User import UserRoles
from models.Table import Table, TablePost, TablePatch, TablePublic

router = APIRouter(
    prefix="/tables",
    tags=["Table"],
    # dependencies=[
    #     Depends(require_role(UserRoles.ADMIN)),
    # ],
)

SessionDep = Annotated[Session, Depends(get_session)]
adminDep = Annotated[UserRoles, Depends(require_role(UserRoles.ADMIN))]


@router.get("/", response_model=List[TablePublic])
def get_all_tables(session: SessionDep, adminDeps: adminDep):
    return session.exec(select(Table)).all()


@router.get("/{table_id}", response_model=TablePublic)
def get_table(table_id: int, session: SessionDep, adminDeps: adminDep):
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found!")
    return db_table


@router.post("/", response_model=TablePublic, status_code=status.HTTP_201_CREATED)
def create_table(table_in: TablePost, session: SessionDep, adminDeps: adminDep):
    db_table = Table.model_validate(table_in)
    session.add(db_table)
    session.commit()
    session.refresh(db_table)
    return db_table


@router.patch("/{table_id}", response_model=TablePublic)
def update_table(
    table_id: int, table_update: TablePatch, session: SessionDep, adminDeps: adminDep
):
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found!")

    update_data = table_update.model_dump(exclude_unset=True)
    db_table.sqlmodel_update(update_data)

    session.add(db_table)
    session.commit()
    session.refresh(db_table)
    return db_table


@router.delete("/{table_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table(table_id: int, session: SessionDep, adminDeps: adminDep):
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found!")

    session.delete(db_table)
    session.commit()
    return None


@router.get("/nfc/{nfc_code}", response_model=TablePublic)
def get_table_by_nfc(nfc_code: str, session: SessionDep):
    statement = select(Table).where(Table.nfc_code == nfc_code)
    db_table = session.exec(statement).first()

    if not db_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid NFC code or table not found!",
        )

    return db_table


# Frontend'in gönderebileceği body modeli
class ScanRequest(BaseModel):
    guest_id: Optional[str] = None


@router.post("/nfc/{nfc_code}")
def scan_table_nfc(
    nfc_code: str, session: SessionDep, payload: Optional[ScanRequest] = None
):
    # 1. NFC koduna sahip masayı bul
    db_table = session.exec(select(Table).where(Table.nfc_code == nfc_code)).first()

    if not db_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geçersiz NFC Kodu veya Masa bulunamadı!",
        )

    # 2. Masa boş mu? Doluysa aktif adisyonu bul, boşsa yeni aç.
    if not db_table.is_occupied:
        # Masa boş, yeni bir adisyon (Ticket) açıyoruz
        active_ticket = Ticket(table_id=db_table.id)
        session.add(active_ticket)

        # Masayı dolu olarak işaretle
        db_table.is_occupied = True
        session.add(db_table)

        session.commit()
        session.refresh(active_ticket)
    else:
        # Masa zaten dolu, aktif adisyonu buluyoruz
        active_ticket = session.exec(
            select(Ticket).where(
                Ticket.table_id == db_table.id, Ticket.is_active == True
            )
        ).first()

        # Güvenlik ağı: Masa dolu görünüyor ama aktif adisyon yoksa (tutarsızlık)
        if not active_ticket:
            active_ticket = Ticket(table_id=db_table.id)
            session.add(active_ticket)
            session.commit()
            session.refresh(active_ticket)

    # 3. Misafir (GuestSession) İşlemleri
    guest_session = None

    # Kullanıcı sayfayı yenilediyse veya daha önce masaya oturduysa mevcut oturumunu bul
    if payload and payload.guest_id:
        try:
            parsed_uuid = uuid.UUID(payload.guest_id)
            guest_session = session.exec(
                select(GuestSession).where(
                    GuestSession.id == parsed_uuid,
                    GuestSession.ticket_id == active_ticket.id,
                )
            ).first()
        except ValueError:
            pass  # Gönderilen UUID geçersizse yeni misafir gibi davran

    # 4. Yeni misafir yarat (veya mevcut değilse)
    if not guest_session:
        # İsimlendirme için masadaki misafir sayısını bul (Misafir 1, Misafir 2...)
        current_guests = session.exec(
            select(GuestSession).where(GuestSession.ticket_id == active_ticket.id)
        ).all()

        guest_session = GuestSession(
            ticket_id=active_ticket.id, guest_name=f"Misafir {len(current_guests) + 1}"
        )
        session.add(guest_session)
        session.commit()
        session.refresh(guest_session)

    # 5. Frontend'in tam olarak beklediği güvenli token JSON'unu dön
    return {
        "table_id": db_table.id,
        "ticket_id": active_ticket.id,
        "guest_id": str(guest_session.id),
        "guest_name": guest_session.guest_name,
        "redirect_url": "/menu",
    }
