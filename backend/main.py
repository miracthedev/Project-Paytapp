from typing import TYPE_CHECKING, Annotated

from fastapi import Depends, FastAPI, status, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, delete, select

from websocketss import manager

from auth.cors import CORS_func
from auth import get_password_hash, create_access_token, verify_password

from TOOLs.assetsLinkCreator import create_asset_links
from auth.auth import require_role
from models.User import Token, User, UserPost, UserPublic, UserRoles
from sql import start_db, get_session, create_dummy_data
from websocketss import router as websocket_router
from routers import (
    orderItemRouter,
    productRouter,
    restaurantRouter,
    tableRouter,
    ticketRouter,
    userRouter,
)

from models.OrderItem import OrderItem
from models.Product import Product
from models.Restaurant import Restaurant
from models.Ticket import Ticket
from models.Table import Table

app = FastAPI()

CORS_func(app)

create_asset_links(app)

global_engine = start_db()

create_dummy_data(global_engine)

SessionDeps = Annotated[Session, Depends(get_session)]

AdminDeps = Annotated[UserRoles, Depends(require_role(UserRoles.ADMIN))]

########### ROUTERLARIMIZ ###########
app.include_router(restaurantRouter.router)
app.include_router(userRouter.router)
app.include_router(tableRouter.router)
app.include_router(ticketRouter.router)
app.include_router(orderItemRouter.router)
app.include_router(productRouter.router)
app.include_router(websocket_router)
######################################


@app.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserPost, session: SessionDeps):
    exists_user = session.exec(select(User).where(User.email == user_in.email)).first()
    if exists_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists!"
        )

    hashed_pw = get_password_hash(user_in.password)

    user_data = user_in.model_dump(exclude={"password"})
    db_user = User(**user_data, hashed_password=hashed_pw)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@app.post("/login", response_model=Token)
def login(
    session: SessionDeps,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    user = session.exec(
        select(User).where(User.email == form_data.username.lower())
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
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
            detail=f"Internal Error: {str(e)}",
        )


@app.delete("/", tags=["☢️"])
async def nuke_db(session: SessionDeps, admin_deps: AdminDeps):
    try:

        await manager.disconnect_all()

        session.exec(delete(OrderItem))
        session.exec(delete(Ticket))
        session.exec(delete(Table))
        session.exec(delete(Product))
        session.exec(delete(Restaurant))
        session.exec(delete(User))
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="error occurred:" + str(e)
        )

    return {"result": "☢️'d database"}
