from app.db.session import engine
from sqlalchemy import text

conn = engine.connect()
result = conn.execute(text("""
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'facturas_venta' 
    ORDER BY ORDINAL_POSITION
"""))
cols = result.fetchall()
print('Columnas en facturas_venta:')
for c in cols:
    print(f'  {c[0]}: {c[1]} (NULL={c[2]})')

conn.close()

