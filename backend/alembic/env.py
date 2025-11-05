from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool
from app.core.config import settings
from app.db.base import Base
import app.models  # asegura que se importen todos los modelos

config = context.config

# Cargar alembic.ini si existe
if getattr(config, "config_file_name", None):
    try:
        fileConfig(config.config_file_name)
    except (FileNotFoundError, IOError):
        pass

# Toma la URL desde settings si no está en alembic.ini
if not config.get_main_option("sqlalchemy.url"):
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata

# --- Opcional: ignora tablas/schemas del sistema ---
def include_object(object, name, type_, reflected, compare_to):
    # Ignora objetos de system schemas
    schema = getattr(object, "schema", None)
    if schema in {"sys", "INFORMATION_SCHEMA"}:
        return False
    return True

def run_migrations_offline():
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,        # <— importante en SQL Server
        include_schemas=True,               # <— pon False si solo usas dbo
        include_object=include_object,
        version_table="alembic_version",
        version_table_schema="dbo",         # <— tu schema
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        {"sqlalchemy.url": settings.DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,    # <— importante en SQL Server
            include_schemas=True,           # <— pon False si solo usas dbo
            include_object=include_object,
            version_table="alembic_version",
            version_table_schema="dbo",     # <— tu schema
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
