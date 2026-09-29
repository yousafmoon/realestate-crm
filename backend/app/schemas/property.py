from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AgentSummary(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class PropertyCreate(BaseModel):
    title: str
    description: str | None = None
    property_type: str
    listing_type: str
    price: float
    bedrooms: int = 0
    bathrooms: int = 0
    area: float
    city: str
    address: str | None = None
    status: str = "available"


class PropertyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    property_type: str | None = None
    listing_type: str | None = None
    price: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    area: float | None = None
    city: str | None = None
    address: str | None = None
    status: str | None = None


class PropertyResponse(BaseModel):
    id: int
    title: str
    description: str | None
    property_type: str
    listing_type: str
    price: float
    bedrooms: int
    bathrooms: int
    area: float
    city: str
    address: str | None
    status: str
    assigned_agent_id: int | None
    assigned_agent: AgentSummary | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyPage(BaseModel):
    items: list[PropertyResponse]
    page: int
    limit: int
    total: int
    pages: int


class AgentAssignment(BaseModel):
    agent_id: int | None