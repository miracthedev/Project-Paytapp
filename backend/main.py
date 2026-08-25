from typing import TYPE_CHECKING, Annotated

from fastapi import Depends, FastAPI, status,HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from auth.cors import CORS_func
from auth import get_password_hash, create_access_token, verify_password

from models.User import Token, User, UserPost, UserPublic
from sql import start_db, get_session, create_dummy_data
from routers import orderItemRouter, productRouter, restaurantRouter, tableRouter, ticketRouter, userRouter

from models.OrderItem import OrderItem
from models.Product import Product
from models.Restaurant import Restaurant
from models.Ticket import Ticket
from models.Table import Table

import httpx

app = FastAPI()

CORS_func(app)

global_engine = start_db()

create_dummy_data(global_engine)

SessionDeps = Annotated[Session, Depends(get_session)]

########### ADDING ROUTERS ###########
app.include_router(restaurantRouter.router)
app.include_router(userRouter.router)
app.include_router(tableRouter.router)
app.include_router(ticketRouter.router)
app.include_router(orderItemRouter.router)
app.include_router(productRouter.router)
######################################

@app.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserPost,
    session: SessionDeps
):
    exists_user = session.exec(select(User).where(User.email == user_in.email))
    if exists_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists!")

    hashed_pw = get_password_hash(user_in.password)

    user_data = user_in.model_dump(exclude={"password"})
    db_user = User(**user_data, hashed_password=hashed_pw)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user

@app.post("/login", response_model=Token)
def login(session: SessionDeps, form_data: Annotated[OAuth2PasswordRequestForm, Depends()],):
    user = session.exec(select(User).where(User.email == form_data.username.lower())).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        # Güvenlik için genel bir hata mesajı dönüyoruz (Username Enumeration saldırılarını önlemek için)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(data={"sub": user.email})

    return Token(access_token=access_token, token_type="bearer")

@app.get("/")
def get_all(session: SessionDeps):

    try:
        all_data = {
            "restaurants": session.exec(select(Restaurant)).all(),
            "tables": session.exec(select(Table)).all(),
            "products": session.exec(select(Product)).all(),
            "users": session.exec(select(User)).all(),
            "tickets": session.exec(select(Ticket)).all(),
            "order_items": session.exec(select(OrderItem)).all(),
        }
        return all_data

    except Exception as e:
        # Terminalde hatanın tam olarak ne olduğunu görmek için:
        print(f"HATA OLUŞTU: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Error: {str(e)}"
        )

@app.delete("/", tags=["☢️"])
def nuke_db(session: SessionDeps):
    all_restaurants = session.exec(select(Restaurant)).all()
    all_tables = session.exec(select(Table)).all()
    all_products = session.exec(select(Product)).all()
    all_users = session.exec(select(User)).all()
    all_tickets = session.exec(select(Ticket)).all()
    all_orders = session.exec(select(OrderItem)).all(),
    
    session.delete(all_restaurants)
    session.delete(all_tables)
    session.delete(all_products)
    session.delete(all_users)
    session.delete(all_tickets)
    session.delete(all_orders)
    session.commit()

    return {
        "result": "☢️'d database"
    }

@app.get("/poke")
def pokeballs():
    pass