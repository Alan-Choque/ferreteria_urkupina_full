from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

@event.listens_for(engine, "before_cursor_execute")
def _enable_fast_executemany(conn, cursor, statement, parameters, context, executemany):
    try:
        if executemany and hasattr(cursor, "fast_executemany"):
            cursor.fast_executemany = True
    except Exception:
        pass

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
