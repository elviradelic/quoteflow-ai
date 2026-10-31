# QuoteFlow AI

An early-stage SaaS application for freelancers and small businesses to create professional quotes and invoices.

## Current implementation

A FastAPI backend with a health endpoint and a quote preview endpoint. Totals use Python Decimal to avoid floating-point arithmetic issues. This is a starter, not a production-ready invoicing system.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for interactive API documentation.

## Example request

POST `/api/quotes/preview`

```json
{
  "client_name": "Example Studio",
  "currency": "USD",
  "items": [
    {"description": "Website design", "quantity": "1", "unit_price": "500.00"},
    {"description": "SEO setup", "quantity": "2", "unit_price": "75.00"}
  ]
}
```

## Next steps

- User accounts and organizations
- PostgreSQL persistence
- Quote lifecycle and numbering
- Editable branded templates and PDF export
- Optional AI drafting, with user approval of amounts
- Localization, tax configuration, payments, and security hardening
