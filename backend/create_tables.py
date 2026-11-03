
from sqlalchemy import inspect

from app.database import Base, engine
from app.models import Quote, QuoteItem


def create_tables():
    print("Connecting to PostgreSQL...")

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    print("Database tables:")

    for table in sorted(tables):
        print(f" - {table}")

    required_tables = {"quotes", "quote_items"}

    if required_tables.issubset(set(tables)):
        print("QuoteFlow AI tables created successfully!")
    else:
        raise RuntimeError("Some required tables are missing.")


if __name__ == "__main__":
    create_tables()
