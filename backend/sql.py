from datetime import datetime, timedelta, timezone
from decimal import Decimal
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

image_host_endpoint = "/images/products"


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
                Restaurant(name="The Restaurant."),
            ]
            session.add_all(restaurants)
            session.commit()
            return restaurants


def create_tables(engine: Engine):
    with Session(engine) as session:
        exists_table = session.get(Table, 1)
        if not exists_table:
            tables: list[Table] = [
                Table(
                    table_name="Masa1",
                    floor=1,
                    restaurant_id=1,
                    region=TableRegion.MAIN,
                    type=TableType.DINING_LONG,
                ),
                Table(
                    table_name="Masa2",
                    floor=2,
                    restaurant_id=1,
                    region=TableRegion.MAIN,
                    type=TableType.DINING_LONG,
                ),
                Table(
                    table_name="Masa3",
                    floor=1,
                    restaurant_id=1,
                    region=TableRegion.TERRACE,
                    type=TableType.DINING_SHORT,
                    is_occupied=True,
                ),
                Table(
                    table_name="Masa4",
                    floor=1,
                    restaurant_id=1,
                    region=TableRegion.TERRACE,
                    type=TableType.STOOL,
                ),
            ]
            session.add_all(tables)
            session.commit()


def create_tickets(engine: Engine):
    with Session(engine) as session:
        exists_tickets = session.get(Ticket, 1)
        if not exists_tickets:
            tickets: list[Ticket] = [Ticket(table_id=1), Ticket(table_id=2)]
            session.add_all(tickets)
            session.commit()


def create_order_item(engine: Engine):
    with Session(engine) as session:
        existing_item = session.get(OrderItem, 1)

        if not existing_item:
            now = datetime.now(timezone.utc)

            order_items: list[OrderItem] = [
                # ==========================================
                # NORMAL DURUMLAR (TICKET 1 - Masa 1)
                # ==========================================
                # 1. Tamamen Boş / Kilitlenmemiş
                OrderItem(
                    ticket_id=1,
                    product_id=1,
                    sh_product_name="Los Pollos Burger",
                    sh_price_singular=Decimal(250.0),
                    is_paid=False,
                    note="exclude the blue tinted rocks in it",
                    quantity=2,
                    locked_by_session=None,
                    locked_until=None,
                ),
                # 2. Şu an Kilitli (Standart Senaryo)
                OrderItem(
                    ticket_id=1,
                    product_id=3,
                    sh_product_name="Patates Kızartması",
                    sh_price_singular=Decimal(80.0),
                    is_paid=False,
                    locked_by_session="session_user_A",
                    locked_until=now + timedelta(minutes=3),
                ),
                # 3. Zaten Ödenmiş
                OrderItem(
                    ticket_id=1,
                    product_id=4,
                    sh_product_name="Kola",
                    sh_price_singular=Decimal(50.0),
                    is_paid=True,
                    paid_by_session="session_user_B",
                    locked_by_session=None,
                    locked_until=None,
                ),
                # ==========================================
                # UÇ DURUMLAR (EDGE CASES) (TICKET 2 - Masa 2)
                # ==========================================
                # 4. Süresi Dolmuş Kilit (Terk Edilmiş Sepet)
                # Backend'in bu ürünün kilidini başkasının almasına izin vermeli.
                OrderItem(
                    ticket_id=2,
                    product_id=5,
                    sh_product_name="Kıymalı Çibörek",
                    sh_price_singular=Decimal(120.0),
                    is_paid=False,
                    locked_by_session="session_user_C",
                    locked_until=now - timedelta(minutes=10),
                ),
                # 5. Eksik Veri: Gelecek tarih var ama Session ID yok!
                # Backend bunu tamamen "kilitsiz" kabul etmeli.
                OrderItem(
                    ticket_id=2,
                    product_id=6,
                    sh_product_name="Ayran",
                    sh_price_singular=Decimal(40.0),
                    is_paid=False,
                    locked_by_session=None,
                    locked_until=now + timedelta(minutes=5),
                ),
                # 6. Eksik Veri: Session ID var ama Tarih yok!
                # Backend geçersiz kilit sayıp başkasına devredebilmeli.
                OrderItem(
                    ticket_id=2,
                    product_id=6,
                    sh_product_name="Ekstra Ayran",
                    sh_price_singular=Decimal(40.0),
                    is_paid=False,
                    locked_by_session="session_user_E",
                    locked_until=None,
                ),
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
                Product(
                    restaurant_id=1,
                    name="Los Pollos Burger",
                    category="Ana Yemek",
                    price=Decimal(250.0),
                    image_url=f"{image_host_endpoint}/burger.jpg",
                ),
                Product(
                    restaurant_id=1,
                    name="Çıtır Tavuk Kovası",
                    category="Ana Yemek",
                    price=Decimal(350.0),
                    image_url=f"{image_host_endpoint}/kebap.jpg",
                ),
                Product(
                    restaurant_id=1,
                    name="Patates Kızartması",
                    category="Yan Ürün",
                    price=Decimal(80.0),
                    image_url=f"{image_host_endpoint}/meze.jpg",
                ),
                Product(
                    restaurant_id=1,
                    name="Kola",
                    category="İçecek",
                    price=Decimal(50.0),
                    image_url=None,
                ),
                Product(
                    restaurant_id=1,
                    name="Çay",
                    category="İçecek",
                    price=Decimal(10.0),
                    image_url=f"{image_host_endpoint}/kahve.jpg",
                ),
                # Gubate (restaurant_id=2) Ürünleri
                Product(
                    restaurant_id=2,
                    name="Kıymalı Çibörek",
                    category="Ana Yemek",
                    price=Decimal(120.0),
                ),
                Product(
                    restaurant_id=2,
                    name="Ayran",
                    category="İçecek",
                    price=Decimal(40.0),
                ),
            ]
            session.add_all(products)
            session.commit()
            print("Products created.")


def create_users(engine: Engine):
    from auth import get_password_hash

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
                    # Düz şifreyi (örneğin "admin123") anında hashliyoruz
                    hashed_password=get_password_hash("admin123"),
                    role=UserRoles.ADMIN,
                ),
                User(
                    restaurant_id=1,
                    email="jesse@lospollos.com",
                    username="jpinkman",
                    # Düz şifre: "jesse123"
                    hashed_password=get_password_hash("jesse123"),
                    role=UserRoles.WAITER,
                ),
                # Gubate (restaurant_id=2)
                User(
                    restaurant_id=2,
                    email="admin@gubate.com",
                    username="gubate_yonetim",
                    # Düz şifre: "gubate123"
                    hashed_password=get_password_hash("gubate123"),
                    role=UserRoles.ADMIN,
                ),
                # The Restaurant. (restaurant_id=3)
                User(
                    restaurant_id=3,
                    email="waiter@therestaurant.com",
                    username="cool_waiter",
                    # Düz şifre: "waiter123"
                    hashed_password=get_password_hash("waiter123"),
                    role=UserRoles.WAITER,
                ),
            ]

            session.add_all(users)
            session.commit()
            print("Mock users inserted into the database successfully!")
