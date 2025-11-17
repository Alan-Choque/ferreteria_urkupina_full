from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class PromotionRuleBase(BaseModel):
    tipo_regla: str = Field(..., max_length=10, description="Tipo de regla, ej. PORCENTAJE o MONTO")
    valor: float = Field(..., ge=0, description="Valor numérico de la regla")
    descripcion: Optional[str] = Field(None, max_length=255)

    @field_validator("tipo_regla")
    @classmethod
    def normalize_tipo_regla(cls, value: str) -> str:
        return value.strip().upper()


class PromotionRuleCreate(PromotionRuleBase):
    pass


class PromotionRuleResponse(PromotionRuleBase):
    id: int

    class Config:
        from_attributes = True


class PromotionBase(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    activo: bool = True

    @field_validator("fecha_fin")
    @classmethod
    def validate_fecha_fin(cls, value: Optional[datetime], info):
        fecha_inicio: Optional[datetime] = info.data.get("fecha_inicio")  # type: ignore[attr-defined]
        if value and fecha_inicio and value < fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return value


class PromotionCreateRequest(PromotionBase):
    reglas: List[PromotionRuleCreate] = Field(default_factory=list, min_length=1)


class PromotionUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(None, min_length=3, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    activo: Optional[bool] = None
    reglas: Optional[List[PromotionRuleCreate]] = Field(default=None)

    @field_validator("fecha_fin")
    @classmethod
    def validate_fecha_fin(cls, value: Optional[datetime], info):
        fecha_inicio: Optional[datetime] = info.data.get("fecha_inicio")  # type: ignore[attr-defined]
        if value and fecha_inicio and value < fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return value


class PromotionResponse(PromotionBase):
    id: int
    reglas: List[PromotionRuleResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class PromotionListResponse(BaseModel):
    items: List[PromotionResponse]
    total: int
    page: int
    page_size: int

