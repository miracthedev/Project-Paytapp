from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sql import get_session
from auth import require_role
from models.User import UserRoles

# Tüm yeni şemaları import ediyoruz
from models.Ticket import Ticket, TicketPost, TicketPatch, TicketPublic, TicketPublicWithItems 

router = APIRouter(
    prefix="/tickets",
    tags=["Ticket"],
    dependencies=[Depends(require_role(UserRoles.ADMIN))]
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/", response_model=List[TicketPublic])
def get_all_tickets(session: SessionDep):
    db_tickets = session.exec(select(Ticket)).all()
    if not db_tickets:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Tickets Found!")
    return db_tickets


@router.get("/{ticket_id}", response_model=TicketPublic)
def get_ticket(ticket_id: int, session: SessionDep):
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found!")
    return db_ticket


@router.post("/", response_model=TicketPublic, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket_in: TicketPost, session: SessionDep):
    # Frontend'den gelen TicketPost objesini, veritabanı Ticket objesine çeviriyoruz
    db_ticket = Ticket.model_validate(ticket_in)
    
    session.add(db_ticket)
    session.commit()
    session.refresh(db_ticket)
    
    return db_ticket


@router.patch("/{ticket_id}", response_model=TicketPublic)
def update_ticket(ticket_id: int, ticket_update: TicketPatch, session: SessionDep):
    # 1. Güncellenecek adisyonu bul
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found!")
    
    # 2. Sadece frontend'den gönderilen verileri al (exclude_unset=True ile)
    update_data = ticket_update.model_dump(exclude_unset=True)
    
    # 3. DB objesini bu verilerle güncelle
    # NOT: sqlmodel'in .sqlmodel_update() metodu bu işi döngüsüz (for kullanmadan) tek satırda çözer
    db_ticket.sqlmodel_update(update_data)
        
    session.add(db_ticket)
    session.commit()
    session.refresh(db_ticket)
    
    return db_ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int, session: SessionDep):
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found!")
    
    session.delete(db_ticket)
    session.commit()
    
    return None

@router.get("/{ticket_id}", response_model=TicketPublicWithItems)
def get_ticket_with_items(ticket_id: int, session: SessionDep):
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found!")

    return db_ticket