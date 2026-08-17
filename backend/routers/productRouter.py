from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sql import get_session
from auth import require_role
from models.User import UserRoles

from models.Product import Product, ProductPost, ProductPatch, ProductPublic 

router = APIRouter(
    prefix="/products",
    tags=["Product"],
    # Ürün ekleme/silme işlemleri sadece ADMIN'lere özeldir
    dependencies=[Depends(require_role(UserRoles.ADMIN))]
)

SessionDep = Annotated[Session, Depends(get_session)]

@router.get("/", response_model=List[ProductPublic])
def get_all_products(session: SessionDep):
    db_products = session.exec(select(Product)).all()
    return db_products

@router.get("/{product_id}", response_model=ProductPublic)
def get_product(product_id: int, session: SessionDep):
    db_product = session.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found!")
    return db_product

@router.post("/", response_model=ProductPublic, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductPost, session: SessionDep):
    db_product = Product.model_validate(product_in)
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product

@router.patch("/{product_id}", response_model=ProductPublic)
def update_product(product_id: int, product_update: ProductPatch, session: SessionDep):
    db_product = session.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found!")
    
    update_data = product_update.model_dump(exclude_unset=True)
    db_product.sqlmodel_update(update_data)
        
    session.add(db_product)
    session.commit()
    session.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, session: SessionDep):
    db_product = session.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found!")
    
    # Gerçek bir sistemde silmek (delete) yerine db_product.is_active = False yapılır
    session.delete(db_product)
    session.commit()
    return None