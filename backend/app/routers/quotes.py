
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Quote, QuoteItem


router = APIRouter(
    prefix="/api/quotes",
    tags=["Quotes"],
)

DbSession = Annotated[Session, Depends(get_db)]


class QuoteItemInput(BaseModel):
    description: str = Field(min_length=1)
    quantity: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    unit_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class QuoteCreate(BaseModel):
    client_name: str = Field(min_length=1, max_length=200)
    project_name: str = Field(
        default="Untitled project",
        max_length=255,
    )
    currency: str = Field(
        default="USD",
        pattern=r"^[A-Z]{3}$",
    )
    items: list[QuoteItemInput] = Field(min_length=1)


class QuoteItemOutput(BaseModel):
    id: int
    description: str
    quantity: Decimal
    unit_price: Decimal

    model_config = {"from_attributes": True}


class QuoteOutput(BaseModel):
    id: int
    client_name: str
    project_name: str
    currency: str
    status: str
    created_at: datetime
    subtotal: Decimal
    items: list[QuoteItemOutput]


def serialize_quote(quote: Quote) -> QuoteOutput:
    subtotal = sum(
        (item.quantity * item.unit_price for item in quote.items),
        Decimal("0.00"),
    )

    return QuoteOutput(
        id=quote.id,
        client_name=quote.client_name,
        project_name=quote.project_name,
        currency=quote.currency,
        status=quote.status,
        created_at=quote.created_at,
        subtotal=subtotal.quantize(Decimal("0.01")),
        items=[
            QuoteItemOutput.model_validate(item)
            for item in quote.items
        ],
    )


@router.post("", response_model=QuoteOutput, status_code=201)
def create_quote(payload: QuoteCreate, db: DbSession):
    quote = Quote(
        client_name=payload.client_name,
        project_name=payload.project_name,
        currency=payload.currency,
        status="Draft",
        items=[
            QuoteItem(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in payload.items
        ],
    )

    db.add(quote)
    db.commit()

    statement = (
        select(Quote)
        .options(selectinload(Quote.items))
        .where(Quote.id == quote.id)
    )

    saved_quote = db.scalar(statement)

    return serialize_quote(saved_quote)


@router.get("", response_model=list[QuoteOutput])
def list_quotes(db: DbSession):
    statement = (
        select(Quote)
        .options(selectinload(Quote.items))
        .order_by(Quote.created_at.desc(), Quote.id.desc())
    )

    quotes = db.scalars(statement).all()

    return [serialize_quote(quote) for quote in quotes]


@router.get("/{quote_id}", response_model=QuoteOutput)
def get_quote(quote_id: int, db: DbSession):
    statement = (
        select(Quote)
        .options(selectinload(Quote.items))
        .where(Quote.id == quote_id)
    )

    quote = db.scalar(statement)

    if quote is None:
        raise HTTPException(
            status_code=404,
            detail="Quote not found",
        )

    return serialize_quote(quote)
