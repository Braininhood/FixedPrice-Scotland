import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from app.core.database import supabase
from app.models.user import PlanType, SubscriptionStatus
from app.services.stripe_service import stripe_service
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class SubscriptionService:
    async def get_user_subscription(self, user_id: UUID):
        response = (
            supabase.table("subscriptions")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data and isinstance(response.data, list) and len(response.data) > 0 else None

    async def create_subscription_request(self, user_id: UUID, plan_type: PlanType):
        """
        Currently, we are waiting for full Stripe integration.
        For now, this service will log the interest and we will send an invoice 
        for bank transfer to the user's email manually.
        In the future, this will trigger a Stripe Checkout session.
        """
        # Get user info
        user_response = supabase.table("user_profiles").select("email, full_name").eq("id", str(user_id)).single().execute()
        
        if not user_response.data or not isinstance(user_response.data, dict):
            raise Exception("User profile not found")
            
        email = user_response.data.get("email", "Unknown")
        full_name = user_response.data.get("full_name", "Valued Customer")

        # Determine amount based on plan
        amounts = {
            PlanType.BUYER_MONTHLY: 9.99,
            PlanType.BUYER_YEARLY: 99.99,  # ~17% savings (9.99 * 12 = 119.88)
            PlanType.AGENT_VERIFICATION: 29.99,
        }
        amount = amounts.get(plan_type, 0.0)

        # Generate payment reference
        import time
        user_initials = email.split('@')[0][:2].upper() if '@' in email else 'FP'
        plan_initials = plan_type.value[:2].upper()
        timestamp = str(int(time.time()))[-6:]
        payment_reference = f"SUB-{user_initials}{plan_initials}{timestamp}"

        # Send the invoice email
        try:
            await EmailService.send_invoice_email(
                email=email,
                full_name=full_name,
                plan_name=plan_type.value,
                amount=amount,
                payment_reference=payment_reference
            )
        except Exception as e:
            # We don't want to fail the whole request if email fails, but we should log it
            print(f"Failed to send invoice email: {e}")

        # Create a pending subscription row so user/agent see it on Account and subscription page
        now = datetime.now(timezone.utc)
        row = {
            "user_id": str(user_id),
            "plan_type": plan_type.value,
            "status": "pending",
            "current_period_start": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
        }
        supabase.table("subscriptions").insert(row).execute()

        return {
            "status": "pending_invoice",
            "message": f"Thank you for your interest in the {plan_type.value} plan. "
                       f"An invoice with bank transfer details has been sent to {email}. "
                       f"Card payments will be available in a future update.",
            "next_steps": "Please check your email for payment instructions.",
            "payment_reference": payment_reference,
            "amount": amount,
            "email": email
        }

    async def update_subscription_status(self, stripe_id: str, status: SubscriptionStatus):
        supabase.table("subscriptions").update({"status": status}).eq("stripe_subscription_id", stripe_id).execute()

    async def cancel_subscription(self, user_id: UUID, cancel_immediately: bool = False):
        """
        Cancel user's subscription.
        If cancel_immediately is False, subscription continues until period_end.
        Sends email notification when subscription is canceled.
        """
        subscription = await self.get_user_subscription(user_id)
        if not subscription:
            raise Exception("No active subscription found")
        
        plan_type = subscription.get("plan_type", "") if isinstance(subscription, dict) else ""
        
        if cancel_immediately:
            # Cancel immediately
            supabase.table("subscriptions").update({
                "status": SubscriptionStatus.CANCELED,
                "cancel_at_period_end": False
            }).eq("user_id", str(user_id)).execute()
            
            # Send deactivation email
            try:
                user_response = supabase.table("user_profiles").select("email, full_name").eq("id", str(user_id)).single().execute()
                if user_response.data and isinstance(user_response.data, dict):
                    email_value = user_response.data.get("email", "")
                    full_name_value = user_response.data.get("full_name", "Valued Member")
                    if email_value and isinstance(email_value, str):
                        plan_names = {
                            "buyer_monthly": "Buyer Premium (Monthly)",
                            "buyer_yearly": "Buyer Premium (Yearly)",
                            "agent_verification": "Verified Agent"
                        }
                        plan_name = plan_names.get(plan_type, plan_type) if isinstance(plan_type, str) else "Subscription"
                        await EmailService.send_subscription_deactivated_email(
                            email=email_value,
                            full_name=full_name_value if isinstance(full_name_value, str) else "Valued Member",
                            plan_name=plan_name,
                            reason="canceled"
                        )
            except Exception as e:
                logger.error(f"Failed to send subscription cancellation email: {e}", exc_info=True)
                # Don't fail the request if email fails
        else:
            # Cancel at period end
            supabase.table("subscriptions").update({
                "cancel_at_period_end": True
            }).eq("user_id", str(user_id)).execute()
        
        return {"message": "Subscription canceled successfully"}

    async def get_payment_history(self, user_id: UUID):
        """
        Get payment history for a user.
        """
        response = supabase.table("payments").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
        return response.data if response.data and isinstance(response.data, list) else []

subscription_service = SubscriptionService()
