
from datetime import date
from decimal import Decimal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.routers.quotes import router as quotes_router


app = FastAPI(
    title="QuoteFlow AI API",
    version="0.4.0",
    description="Backend API for QuoteFlow AI SaaS.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


app.include_router(quotes_router)


class QuoteItem(BaseModel):
    description: str = Field(min_length=1)
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)


class QuoteRequest(BaseModel):
    client_name: str = Field(min_length=1)
    currency: str = Field(
        default="USD",
        pattern=r"^[A-Z]{3}$",
    )
    items: list[QuoteItem] = Field(min_length=1)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "quoteflow-ai",
    }


@app.post("/api/quotes/preview")
def preview_quote(quote: QuoteRequest):
    subtotal = sum(
        (
            item.quantity * item.unit_price
            for item in quote.items
        ),
        Decimal("0.00"),
    )

    return {
        "client_name": quote.client_name,
        "currency": quote.currency,
        "date": date.today().isoformat(),
        "items": [
            item.model_dump(mode="json")
            for item in quote.items
        ],
        "subtotal": str(
            subtotal.quantize(Decimal("0.01"))
        ),
        "note": "Taxes and discounts are not included.",
    }
