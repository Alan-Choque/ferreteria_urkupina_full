#!/usr/bin/env python3
"""Script to test database connection."""
from sqlalchemy import create_engine, text
from app.core.config import settings

try:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        result.fetchone()
    print("DB OK")
except Exception as e:
    print(f"DB ERROR: {repr(e)}")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    exit(1)


