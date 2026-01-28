from fastapi import APIRouter, Request, HTTPException, Header
from app.services.stripe_service import stripe_service
from app.services.payment_service import payment_service
import stripe

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None)
):
    """
    Webhook handler for Stripe events.
    (Waiting for Stripe Webhook Secret to enable verification)
    """
    payload = await request.body()
    
    try:
        # If we have the secret, verify the signature
        if stripe_service.verify_webhook(payload, stripe_signature):
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, stripe_service.settings.STRIPE_WEBHOOK_SECRET
            )
        else:
            # Fallback for testing without signature verification if needed
            import json
            event = json.loads(payload)
            
        await payment_service.handle_stripe_webhook(event)
        return {"status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
