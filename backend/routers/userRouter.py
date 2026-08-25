from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sql import get_session
from auth import require_role, get_password_hash
from models.User import UserRoles

# UserPatch şemasını models/User.py içine (tüm alanları Optional olarak) eklediğinizi varsayıyoruz
from models.User import User, UserPost, UserPatch, UserPublic

SessionDep = Annotated[Session, Depends(get_session)]
adminDep = Annotated[UserRoles, Depends(require_role(UserRoles.ADMIN))]

router = APIRouter(
    prefix="/users",
    tags=["User"],
    dependencies=[Depends(require_role(UserRoles.ADMIN))]
)


@router.get("/", response_model=List[UserPublic])
def get_all_users(session: SessionDep):
    return session.exec(select(User)).all()

@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: int, session: SessionDep):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found!")
    return db_user

@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserPost, session: SessionDep):
    # 1. Parolayı hashle
    hashed_pw = get_password_hash(user_in.password)
    
    # 2. Gelen veriyi (şifre hariç) al ve hashlenmiş şifreyi ekleyerek DB modelini oluştur
    extra_data = {"hashed_password": hashed_pw}
    db_user = User.model_validate(user_in, update=extra_data)
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.patch("/{user_id}", response_model=UserPublic)
def update_user(user_id: int, user_update: UserPatch, session: SessionDep):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found!")
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Eğer güncelleme işleminde şifre değiştirilmek isteniyorsa onu da hashlemeliyiz
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
    db_user.sqlmodel_update(update_data)
        
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, session: SessionDep):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found!")
    
    session.delete(db_user)
    session.commit()
    return None