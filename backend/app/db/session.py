from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)


@event.listens_for(engine, "before_cursor_execute")
def _enable_fast_executemany(
    conn, cursor, statement, parameters, context, executemany  # type: ignore[override]
) -> None:
    try:
        if executemany and hasattr(cursor, "fast_executemany"):
            cursor.fast_executemany = True
    except Exception:  # pragma: no cover - medida defensiva
        pass


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
