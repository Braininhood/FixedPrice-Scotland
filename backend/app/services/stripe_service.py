import stripe
from app.core.config import settings

class StripeService:
    def __init__(self):
        # NOTE: Waiting for final Stripe API keys from customer.
        # In the future, this will handle all automated card payments.
        if settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY
        self.stripe = stripe

    def create_customer(self, email: str, name: str):
        if not settings.STRIPE_SECRET_KEY:
            return None
        return self.stripe.Customer.create(email=email, name=name)

    def create_checkout_session(self, customer_id: str, price_id: str, success_url: str, cancel_url: str):
        if not settings.STRIPE_SECRET_KEY:
            return None
        return self.stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
        )

    def verify_webhook(self, payload: str, sig_header: str):
        if not settings.STRIPE_WEBHOOK_SECRET:
            return None
        return self.stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

stripe_service = StripeService()
