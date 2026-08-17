from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sql import get_session
from auth import require_role
from models.User import UserRoles

from models.Table import Table, TablePost, TablePatch, TablePublic

router = APIRouter(
    prefix="/tables",
    tags=["Table"],
    dependencies=[Depends(require_role(UserRoles.ADMIN))]
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/", response_model=List[TablePublic])
def get_all_tables(session: SessionDep):
    return session.exec(select(Table)).all()

@router.get("/{table_id}", response_model=TablePublic)
def get_table(table_id: int, session: SessionDep):
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found!")
    return db_table

@router.post("/", response_model=TablePublic, status_code=status.HTTP_201_CREATED)
def create_table(table_in: TablePost, session: SessionDep):
    db_table = Table.model_validate(table_in)
    session.add(db_table)
    session.commit()
    session.refresh(db_table)
    return db_table

@router.patch("/{table_id}", response_model=TablePublic)
def update_table(table_id: int, table_update: TablePatch, session: SessionDep):
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
def delete_table(table_id: int, session: SessionDep):
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found!")
    
    session.delete(db_table)
    session.commit()
    return None