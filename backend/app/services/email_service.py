import os
import logging
from pathlib import Path
from typing import List, Dict, Any
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates' / 'email'
)

class EmailService:
    @staticmethod
    def _check_email_config() -> bool:
        """Check if email configuration is properly set up."""
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD or not settings.MAIL_FROM:
            logger.warning("Email service not configured: MAIL_USERNAME, MAIL_PASSWORD, or MAIL_FROM is missing")
            return False
        return True
    
    @staticmethod
    async def send_email(
        email: List[str],
        subject: str,
        template_name: str,
        template_body: Dict[str, Any]
    ):
        if not EmailService._check_email_config():
            logger.error(f"Cannot send email to {email}: Email service not configured. Please set MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM in environment variables.")
            raise ValueError("Email service not configured. Please contact administrator.")
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=email,
                template_body=template_body,
                subtype=MessageType.html
            )
            
            fm = FastMail(conf)
            await fm.send_message(message, template_name=template_name)
            logger.info(f"Email sent successfully to {email} with subject: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {str(e)}", exc_info=True)
            raise

    @staticmethod
    async def send_welcome_email(email: str, full_name: str):
        await EmailService.send_email(
            email=[email],
            subject="Welcome to FixedPrice Scotland",
            template_name="welcome.html",
            template_body={"full_name": full_name}
        )

    @staticmethod
    async def send_invoice_email(email: str, full_name: str, plan_name: str, amount: float, payment_reference: str):
        await EmailService.send_email(
            email=[email],
            subject="Invoice for Subscription - FixedPrice Scotland",
            template_name="invoice.html",
            template_body={
                "full_name": full_name,
                "plan_name": plan_name,
                "amount": f"{amount:.2f}",
                "bank_details": {
                    "account_name": "FixedPrice Scotland Ltd",
                    "sort_code": "00-00-00",
                    "account_number": "12345678",
                    "reference": payment_reference
                }
            }
        )

    @staticmethod
    async def send_listing_confirmation(email: str, listing_title: str):
        await EmailService.send_email(
            email=[email],
            subject="Listing Published - FixedPrice Scotland",
            template_name="listing_confirmation.html",
            template_body={
                "listing_title": listing_title
            }
        )

    @staticmethod
    async def send_search_alert_email(email: str, full_name: str, search_name: str, listing_title: str, listing_url: str, listing_price: str):
        await EmailService.send_email(
            email=[email],
            subject=f"New Property Match: {listing_title}",
            template_name="search_alert.html",
            template_body={
                "full_name": full_name,
                "search_name": search_name,
                "listing_title": listing_title,
                "listing_url": listing_url,
                "listing_price": listing_price
            }
        )

    @staticmethod
    async def send_subscription_activated_email(email: str, full_name: str, plan_name: str, plan_type: str):
        """Send email when subscription is activated (verified status)."""
        await EmailService.send_email(
            email=[email],
            subject=f"Subscription Activated - {plan_name}",
            template_name="subscription_activated.html",
            template_body={
                "full_name": full_name,
                "plan_name": plan_name,
                "plan_type": plan_type
            }
        )

    @staticmethod
    async def send_subscription_deactivated_email(email: str, full_name: str, plan_name: str, reason: str = "Subscription canceled"):
        """Send email when subscription is deactivated/canceled (unverified status)."""
        await EmailService.send_email(
            email=[email],
            subject=f"Subscription {reason} - FixedPrice Scotland",
            template_name="subscription_deactivated.html",
            template_body={
                "full_name": full_name,
                "plan_name": plan_name,
                "reason": reason
            }
        )

    @staticmethod
    async def send_role_changed_email(email: str, full_name: str, old_role: str, new_role: str):
        """Send email when user role is changed by admin."""
        await EmailService.send_email(
            email=[email],
            subject="Account Role Updated - FixedPrice Scotland",
            template_name="role_changed.html",
            template_body={
                "full_name": full_name,
                "old_role": old_role,
                "new_role": new_role
            }
        )
