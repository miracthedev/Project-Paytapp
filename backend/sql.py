from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING
from sqlalchemy import Engine
from sqlmodel import SQLModel, Session, create_engine

from models.OrderItem import OrderItem
from models.User import User, UserRoles
from models.Product import Product
from models.Ticket import Ticket
from models.Table import Table, TableRegion, TableType
from models.Restaurant import Restaurant


sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url, echo=True)
SQLModel.metadata.create_all(engine)

def start_db():
    return engine

def get_session():
    with Session(engine) as session:
        yield session

def create_dummy_data(engine: Engine):
    create_restaurants(engine)
    create_tables(engine)
    create_order_item(engine)
    create_products(engine)
    create_users(engine)
    create_tickets(engine)

def create_restaurants(engine: Engine):
    with Session(engine) as session:
        existing_restaurant = session.get(Restaurant, 1)
        if not existing_restaurant:
            restaurants: list[Restaurant] = [
            Restaurant(name="Los Pollos Harmanos"),
            Restaurant(name="Gubate"),
            Restaurant(name="The Restaurant.")]
            session.add_all(restaurants)
            session.commit()
            return restaurants

def create_tables(engine: Engine):
    with Session(engine) as session:
        exists_table = session.get(Table, 1)
        if not exists_table:
            tables: list[Table] = [
                Table(table_name="Masa1", floor=1, restaurant_id=1, region=TableRegion.MAIN, type=TableType.DINING_LONG),
                Table(table_name="Masa2", floor=2, restaurant_id=1, region=TableRegion.MAIN, type=TableType.DINING_LONG),
                Table(table_name="Masa3", floor=1, restaurant_id=1, region=TableRegion.TERRACE, type=TableType.DINING_SHORT, is_occupied=True),
                Table(table_name="Masa4", floor=1, restaurant_id=1, region=TableRegion.TERRACE, type=TableType.STOOL)
            ]
            session.add_all(tables)
            session.commit()
            

def create_tickets(engine: Engine):
    with Session(engine) as session:
        exists_tickets = session.get(Ticket, 1)
        if not exists_tickets:
            tickets: list[Ticket] = [
                Ticket(table_id=1),
                Ticket(table_id=2)
            ]
            session.add_all(tickets)
            session.commit()
        


def create_order_item(engine: Engine):
    with Session(engine) as session:
        existing_item = session.get(OrderItem, 1)
        
        if not existing_item:
            order_items: list[OrderItem] = [
                # ---------------------------------------------------------
                # TICKET 1 (Masa 1) - Standart Senaryo
                # Henüz hiçbir işlem yapılmamış, yeni sipariş edilmiş ürünler
                # ---------------------------------------------------------
                OrderItem(
                    ticket_id=1, 
                    product_name="Los Pollos Burger", 
                    price=250.0
                ),
                OrderItem(
                    ticket_id=1, 
                    product_name="Patates Kızartması", 
                    price=80.0
                ),
                OrderItem(
                    ticket_id=1, 
                    product_name="Kola", 
                    price=50.0
                ),

                # ---------------------------------------------------------
                # TICKET 2 (Masa 2) - Alman Usulü ve Kilit (Soft Lock) Senaryoları
                # ---------------------------------------------------------
                
                # Senaryo A: Başarıyla ÖDENMİŞ bir ürün
                OrderItem(
                    ticket_id=2, 
                    product_name="Çıtır Tavuk Kovası", 
                    price=350.0, 
                    is_paid=True, 
                    paid_by_session="session_xyz_123" # Bu ürünü ödeyen kişinin anonim ID'si
                ),
                
                # Senaryo B: Şu an başka bir müşterinin ekranında KİLİTLİ olan ürün
                # (Müşteri "Öde"ye basmış, Iyzico ekranında kart bilgilerini giriyor)
                OrderItem(
                    ticket_id=2, 
                    product_name="Kıymalı Çibörek", 
                    price=120.0,
                    locked_by_session="session_abc_987", # Kilitleyen kişinin ID'si
                    # Şu andan itibaren 3 dakika boyunca başkası bu ürünü seçemez
                    locked_until=datetime.now(timezone.utc) + timedelta(minutes=3) 
                ),
                
                # Senaryo C: Aynı masada duran ama henüz kimsenin ödemediği/kilitlemediği ürün
                OrderItem(
                    ticket_id=2, 
                    product_name="Ayran", 
                    price=40.0
                )
            ]
            
            session.add_all(order_items)
            session.commit()
            print("Mock order items inserted into the database successfully!")

def create_products(engine: Engine):
    with Session(engine) as session:
        existing_product = session.get(Product, 1)
        if not existing_product:
            products: list[Product] = [
                # Los Pollos Hermanos (restaurant_id=1) Ürünleri
                Product(restaurant_id=1, name="Los Pollos Burger", category="Ana Yemek", price=250.0),
                Product(restaurant_id=1, name="Çıtır Tavuk Kovası", category="Ana Yemek", price=350.0),
                Product(restaurant_id=1, name="Patates Kızartması", category="Yan Ürün", price=80.0),
                Product(restaurant_id=1, name="Kola", category="İçecek", price=50.0),
                
                # Gubate (restaurant_id=2) Ürünleri
                Product(restaurant_id=2, name="Kıymalı Çibörek", category="Ana Yemek", price=120.0),
                Product(restaurant_id=2, name="Ayran", category="İçecek", price=40.0)
            ]
            session.add_all(products)
            session.commit()
            print("Products created.")

def create_users(engine: Engine):
    with Session(engine) as session:
        # Veritabanında ilk kullanıcı var mı diye kontrol edelim
        existing_user = session.get(User, 1)
        
        if not existing_user:
            users: list[User] = [
                # Los Pollos Hermanos (restaurant_id=1)
                User(
                    restaurant_id=1, 
                    email="gustavo@lospollos.com", 
                    username="gfring", 
                    hashed_password="hashed_secret_password_1", 
                    role=UserRoles.ADMIN
                ),
                User(
                    restaurant_id=1, 
                    email="jesse@lospollos.com", 
                    username="jpinkman", 
                    hashed_password="hashed_secret_password_2", 
                    role=UserRoles.WAITER
                ),
                
                # Gubate (restaurant_id=2)
                User(
                    restaurant_id=2, 
                    email="admin@gubate.com", 
                    username="gubate_yonetim", 
                    hashed_password="hashed_secret_password_3", 
                    role=UserRoles.ADMIN
                ),
                
                # The Restaurant. (restaurant_id=3)
                User(
                    restaurant_id=3, 
                    email="waiter@therestaurant.com", 
                    username="cool_waiter", 
                    hashed_password="hashed_secret_password_4", 
                    role=UserRoles.WAITER
                )
            ]
            
            session.add_all(users)
            session.commit()
            print("Mock users inserted into the database successfully!")