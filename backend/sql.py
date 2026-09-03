from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID
import uuid
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
                Restaurant(name="Meydan Ocakbaşı"),
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


def generate_uuid4():
    return uuid.uuid4()


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
                    id=None,
                    ticket_id=1,
                    product_id=1,
                    sh_product_name="Mercimek Çorbası",
                    sh_price_singular=Decimal("120.0"),
                    is_paid=False,
                    note="Bol tereyağlı olsun, acı olmasın",
                    quantity=2,
                    locked_by_session_id=None,
                    locked_until=None,
                ),
                # 2. Şu an Kilitli (Standart Senaryo)
                OrderItem(
                    id=None,
                    ticket_id=1,
                    product_id=6,
                    sh_product_name="Adana Kebap",
                    sh_price_singular=Decimal("420.0"),
                    is_paid=False,
                    locked_by_session_id=uuid.uuid4(),
                    locked_until=now + timedelta(minutes=3),
                    locked_by_name="Misafir 1",
                ),
                # 3. Zaten Ödenmiş
                OrderItem(
                    id=None,
                    ticket_id=1,
                    product_id=4,
                    sh_product_name="Humus",
                    sh_price_singular=Decimal("150.0"),
                    is_paid=True,
                    paid_by_session_id=uuid.uuid4(),
                    paid_by_name="Misafir 2",
                    locked_by_session_id=None,
                    locked_until=None,
                ),
                # ==========================================
                # UÇ DURUMLAR (EDGE CASES) (TICKET 2 - Masa 2)
                # ==========================================
                # 4. Süresi Dolmuş Kilit (Terk Edilmiş Sepet)
                OrderItem(
                    id=None,
                    ticket_id=2,
                    product_id=5,
                    sh_product_name="İçli Köfte",
                    sh_price_singular=Decimal("90.0"),
                    is_paid=False,
                    locked_by_session_id=uuid.uuid4(),
                    locked_until=now - timedelta(minutes=10),
                    locked_by_name="Misafir 3",
                ),
                # 5. Eksik Veri: Gelecek tarih var ama Session ID yok!
                OrderItem(
                    id=None,
                    ticket_id=2,
                    product_id=7,
                    sh_product_name="Tavuk Şiş",
                    sh_price_singular=Decimal("320.0"),
                    is_paid=False,
                    locked_by_session_id=None,
                    locked_until=now + timedelta(minutes=5),
                ),
                # 6. Eksik Veri: Session ID var ama Tarih yok!
                OrderItem(
                    id=None,
                    ticket_id=2,
                    product_id=2,
                    sh_product_name="Ezogelin Çorbası",
                    sh_price_singular=Decimal("130.0"),
                    is_paid=False,
                    locked_by_session_id=uuid.uuid4(),
                    locked_until=None,
                    locked_by_name="Misafir 4",
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
                # Meydan Ocakbaşı (restaurant_id=1) Ürünleri
                Product(
                    id=1,
                    restaurant_id=1,
                    name="Mercimek Çorbası",
                    category="Çorbalar",
                    price=Decimal("120.0"),
                ),
                Product(
                    id=2,
                    restaurant_id=1,
                    name="Ezogelin Çorbası",
                    category="Çorbalar",
                    price=Decimal("130.0"),
                ),
                Product(
                    id=3,
                    restaurant_id=1,
                    name="İşkembe Çorbası",
                    category="Çorbalar",
                    price=Decimal("160.0"),
                ),
                Product(
                    id=4,
                    restaurant_id=1,
                    name="Humus",
                    category="Ara Sıcaklar & Mezeler",
                    price=Decimal("150.0"),
                ),
                Product(
                    id=5,
                    restaurant_id=1,
                    name="İçli Köfte",
                    category="Ara Sıcaklar & Mezeler",
                    price=Decimal("90.0"),
                ),
                Product(
                    id=6,
                    restaurant_id=1,
                    name="Adana Kebap",
                    category="Ana Yemekler",
                    price=Decimal("420.0"),
                ),
                Product(
                    id=7,
                    restaurant_id=1,
                    name="Tavuk Şiş",
                    category="Ana Yemekler",
                    price=Decimal("320.0"),
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
