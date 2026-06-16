from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from models import Base as ModelsBase
    ModelsBase.metadata.create_all(bind=engine)
    ensure_sqlite_schema()
    ensure_default_categories()

def ensure_sqlite_schema():
    if not settings.DATABASE_URL.startswith("sqlite"):
        return
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "users" in table_names:
        try:
            ensure_user_role_constraints()
        except OperationalError:
            # DB Browser for SQLite can keep the file locked during development.
            # The constraints are applied automatically on the next unlocked startup.
            pass
    if "incidents" in table_names:
        incident_columns = {column["name"] for column in inspector.get_columns("incidents")}
        with engine.begin() as connection:
            if "notes_technicien" not in incident_columns:
                connection.execute(text("ALTER TABLE incidents ADD COLUMN notes_technicien TEXT"))
    if "rapports" not in table_names:
        return
    columns = {column["name"] for column in inspector.get_columns("rapports")}
    with engine.begin() as connection:
        if "incident_id" not in columns:
            connection.execute(text("ALTER TABLE rapports ADD COLUMN incident_id INTEGER"))
        if "publie_client" not in columns:
            connection.execute(text("ALTER TABLE rapports ADD COLUMN publie_client BOOLEAN NOT NULL DEFAULT 0"))
        if "notes_technicien" not in columns:
            connection.execute(text("ALTER TABLE rapports ADD COLUMN notes_technicien TEXT"))
        if "supprime" not in columns:
            connection.execute(text("ALTER TABLE rapports ADD COLUMN supprime BOOLEAN NOT NULL DEFAULT 0"))


def ensure_user_role_constraints():
    allowed_roles = "'admin', 'technicien', 'client'"
    with engine.begin() as connection:
        connection.execute(text(
            f"UPDATE users SET role = 'client' WHERE role NOT IN ({allowed_roles}) OR role IS NULL"
        ))
        connection.execute(text("""
            CREATE TRIGGER IF NOT EXISTS users_role_insert_check
            BEFORE INSERT ON users
            WHEN NEW.role NOT IN ('admin', 'technicien', 'client')
            BEGIN
                SELECT RAISE(ABORT, 'role must be admin, technicien, or client');
            END;
        """))
        connection.execute(text("""
            CREATE TRIGGER IF NOT EXISTS users_role_update_check
            BEFORE UPDATE OF role ON users
            WHEN NEW.role NOT IN ('admin', 'technicien', 'client')
            BEGIN
                SELECT RAISE(ABORT, 'role must be admin, technicien, or client');
            END;
        """))


def ensure_default_categories():
    from models import Category

    default_categories = [
        ("Réseau", "Problèmes liés à la connectivité et infrastructure réseau"),
        ("Matériel", "Pannes et dysfonctionnements d'équipements physiques"),
        ("Logiciel", "Bugs, erreurs et problèmes applicatifs"),
        ("Sécurité", "Incidents liés à la cybersécurité et accès"),
        ("Base de données", "Problèmes de données et de serveurs DB"),
        ("Téléphonie", "Problèmes de téléphones fixes et mobiles"),
        ("Impression", "Imprimantes, scanners et copieurs"),
        ("Accès & Droits", "Gestion des comptes, permissions et authentification"),
    ]

    db = SessionLocal()
    try:
        existing = {category.nom.casefold(): category for category in db.query(Category).all()}
        for nom, description in default_categories:
            category = existing.get(nom.casefold())
            if category:
                category.description = description
                category.parent_id = None
                continue
            db.add(Category(nom=nom, description=description, parent_id=None))
        db.commit()
    except OperationalError:
        db.rollback()
    finally:
        db.close()
