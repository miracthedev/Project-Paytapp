from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sql import get_session
from auth import require_role
from models.User import UserRoles

# Restaurant modellerinizin de (RestaurantPost, RestaurantPatch, RestaurantPublic)
# models/Restaurant.py içinde tanımlandığını varsayıyoruz.
from models.Restaurant import Restaurant, RestaurantPost, RestaurantPatch, RestaurantPublic

router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurant"],
    dependencies=[Depends(require_role(UserRoles.ADMIN))]
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/", response_model=List[RestaurantPublic])
def get_all_restaurants(session: SessionDep):
    return session.exec(select(Restaurant)).all()

@router.get("/{restaurant_id}", response_model=RestaurantPublic)
def get_restaurant(restaurant_id: int, session: SessionDep):
    db_restaurant = session.get(Restaurant, restaurant_id)
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found!")
    return db_restaurant

@router.post("/", response_model=RestaurantPublic, status_code=status.HTTP_201_CREATED)
def create_restaurant(restaurant_in: RestaurantPost, session: SessionDep):
    db_restaurant = Restaurant.model_validate(restaurant_in)
    session.add(db_restaurant)
    session.commit()
    session.refresh(db_restaurant)
    return db_restaurant

@router.patch("/{restaurant_id}", response_model=RestaurantPublic)
def update_restaurant(restaurant_id: int, restaurant_update: RestaurantPatch, session: SessionDep):
    db_restaurant = session.get(Restaurant, restaurant_id)
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found!")
    
    update_data = restaurant_update.model_dump(exclude_unset=True)
    db_restaurant.sqlmodel_update(update_data)
        
    session.add(db_restaurant)
    session.commit()
    session.refresh(db_restaurant)
    return db_restaurant

@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_restaurant(restaurant_id: int, session: SessionDep):
    db_restaurant = session.get(Restaurant, restaurant_id)
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found!")
    
    session.delete(db_restaurant)
    session.commit()
    return None