from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.property import Property
from app.models.user import User
from app.schemas.property import (
    AgentAssignment,
    PropertyPage,
    PropertyCreate,
    PropertyResponse,
    PropertyUpdate,
)


router = APIRouter(
    prefix="/properties",
    tags=["Properties"],
)


@router.post(
    "",
    response_model=PropertyResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    property = Property(
        title=property_data.title,
        description=property_data.description,
        property_type=property_data.property_type,
        listing_type=property_data.listing_type,
        price=property_data.price,
        bedrooms=property_data.bedrooms,
        bathrooms=property_data.bathrooms,
        area=property_data.area,
        city=property_data.city,
        address=property_data.address,
        status=property_data.status,
    )

    db.add(property)
    db.commit()
    db.refresh(property)

    return property


@router.get(
    "",
    response_model=PropertyPage,
)
def get_properties(
    city: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    property_type: str | None = None,
    listing_type: str | None = None,
    agent_id: int | None = Query(default=None, ge=1),
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "agent")),
):
    filters = []

    if city:
        filters.append(Property.city.ilike(city))
    if status_filter:
        filters.append(Property.status == status_filter)
    if property_type:
        filters.append(Property.property_type == property_type)
    if listing_type:
        filters.append(Property.listing_type == listing_type)
    if search:
        search_pattern = f"%{search}%"
        filters.append(
            or_(
                Property.title.ilike(search_pattern),
                Property.description.ilike(search_pattern),
                Property.city.ilike(search_pattern),
                Property.address.ilike(search_pattern),
            )
        )

    if current_user.role == "agent":
        if agent_id is not None and agent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Agents may only filter their own assigned properties",
            )
        filters.append(Property.assigned_agent_id == current_user.id)
    elif agent_id is not None:
        filters.append(Property.assigned_agent_id == agent_id)

    count_statement = select(func.count()).select_from(Property).where(*filters)
    total = db.scalar(count_statement) or 0

    statement = (
        select(Property)
        .options(selectinload(Property.assigned_agent))
        .where(*filters)
        .order_by(Property.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    properties = db.scalars(statement).all()

    return {
        "items": properties,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": ceil(total / limit),
    }


@router.get(
    "/{property_id}",
    response_model=PropertyResponse,
)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "agent")),
):
    property = db.scalar(
        select(Property)
        .options(selectinload(Property.assigned_agent))
        .where(Property.id == property_id)
    )

    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    ensure_property_access(property, current_user)
    return property


@router.put(
    "/{property_id}",
    response_model=PropertyResponse,
)
def update_property(
    property_id: int,
    property_data: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager", "agent")),
):
    property = db.get(Property, property_id)

    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    ensure_property_access(property, current_user)
    update_data = property_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(property, field, value)

    db.commit()
    db.refresh(property)

    return property


@router.delete(
    "/{property_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    property = db.get(Property, property_id)

    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    db.delete(property)
    db.commit()

    return None


@router.patch(
    "/{property_id}/assign-agent",
    response_model=PropertyResponse,
)
def assign_agent(
    property_id: int,
    assignment: AgentAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "manager")),
):
    property = db.scalar(
        select(Property)
        .options(selectinload(Property.assigned_agent))
        .where(Property.id == property_id)
    )

    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    agent = None
    if assignment.agent_id is not None:
        agent = db.get(User, assignment.agent_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        if agent.role != "agent":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user must have the agent role",
            )

    property.assigned_agent = agent
    db.commit()
    db.refresh(property)
    return property


def ensure_property_access(property: Property, current_user: User) -> None:
    if (
        current_user.role == "agent"
        and property.assigned_agent_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This property is not assigned to you",
        )