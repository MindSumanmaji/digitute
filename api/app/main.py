from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="DigiTute Backend API",
    description="Backend API for DigiTute Coaching Institute Management",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, admin, teacher, student
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(teacher.router)
app.include_router(student.router)



@app.get("/")
def root():
    return {
        "app": "DigiTute Backend API",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    configured = bool(settings.SUPABASE_URL and (settings.SUPABASE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY))
    return {
        "status": "healthy",
        "supabase_configured": configured
    }


from fastapi import Request
import hmac
import hashlib
from app.db import get_supabase_client
from datetime import datetime, timezone

@app.post("/api/payments/webhook", summary="Razorpay Webhook for Asynchronous Payment Reconciliation")
async def razorpay_webhook(request: Request):
    try:
        payload_bytes = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

        if webhook_secret and signature:
            expected_sig = hmac.new(
                webhook_secret.encode("utf-8"),
                payload_bytes,
                hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(expected_sig, signature):
                return {"status": "ignored", "reason": "invalid_signature"}

        data = await request.json()
        event = data.get("event")

        if event in ["payment.captured", "order.paid"]:
            payload_entity = data.get("payload", {}).get("payment", {}).get("entity") or {}
            order_id = payload_entity.get("order_id")
            payment_id = payload_entity.get("id")
            notes = payload_entity.get("notes") or {}
            invoice_id = notes.get("invoice_id")

            if order_id and invoice_id:
                supabase = get_supabase_client()
                now_iso = datetime.now(timezone.utc).isoformat()

                # Update payment
                supabase.table("payments").update({
                    "status": "SUCCESS",
                    "razorpay_payment_id": payment_id,
                    "paid_at": now_iso
                }).eq("razorpay_order_id", order_id).execute()

                # Update invoice
                inv_res = supabase.table("invoices").select("payable_amount").eq("id", invoice_id).execute()
                if inv_res.data:
                    amt = float(inv_res.data[0].get("payable_amount") or 0.0)
                    supabase.table("invoices").update({
                        "status": "PAID",
                        "amount_paid": amt,
                        "updated_at": now_iso
                    }).eq("id", invoice_id).execute()

        return {"status": "processed"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
