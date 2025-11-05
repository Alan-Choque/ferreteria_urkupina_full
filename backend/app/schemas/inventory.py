from pydantic import BaseModel
class StockByWarehouse(BaseModel):
    warehouse_id: int
    qty: int
