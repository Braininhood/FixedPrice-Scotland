import json
import asyncio
from typing import Optional, Tuple
from openai import OpenAI, RateLimitError, APIError
from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.classification import ClassificationStatus

logger = get_logger(__name__)

class ClassificationService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-4o" # Recommended model for 2026
        self.max_retries = 3
        self.retry_delay = 2  # seconds
        self.rate_limit_delay = 5  # seconds for rate limit errors

    async def classify_listing(self, description: str, price_text: str) -> Tuple[ClassificationStatus, int, str]:
        """
        Classifies a property listing as 'explicit' fixed price, 'likely' fixed price, or 'competitive'.
        Uses a refined prompt with comprehensive classification patterns for accurate categorization.
        Returns: (status, confidence_score, reason)
        """
        prompt = f"""
You are an expert in the Scottish property market specializing in analyzing property listings to determine pricing strategies. Your task is to classify listings into three distinct categories based on pricing language and seller intent.

LISTING TO ANALYZE:
Price: {price_text}
Description: {description}

CLASSIFICATION CATEGORIES:

1. EXPLICIT FIXED PRICE ("explicit"):
   The listing CLEARLY and UNAMBIGUOUSLY states a fixed price with no competitive bidding language.
   
   Key Indicators:
   - "Fixed Price £X" or "Fixed Price: £X"
   - "£X" with no "offers over", "offers invited", or "closing date" language
   - "Price: £X" (standalone, no competitive language)
   - "Asking Price: £X" (when no competitive indicators present)
   - "Offers in the region of £X" (when clearly indicating fixed price intent)
   - "Guide Price: £X" (when no competitive language)
   - Explicit statements like "No offers over", "Fixed at £X", "Price set at £X"
   
   Examples:
   - "Fixed Price £250,000"
   - "£180,000" (with description mentioning quick sale, no offers language)
   - "Price: £320,000. Seller seeking quick sale."
   - "Asking Price £195,000. No closing date set."

2. LIKELY FIXED PRICE ("likely"):
   The listing suggests willingness to accept fixed price but uses ambiguous or mixed language.
   These are buyer-friendly listings where fixed price is possible but not explicitly guaranteed.
   
   Key Indicators:
   - "Offers Over £X (Fixed Price Considered)"
   - "Offers Over £X. Fixed price offers welcome."
   - "Offers Over £X. Seller willing to accept fixed price."
   - "Offers Over £X. Quick sale preferred."
   - "Offers Over £X. No closing date."
   - "Offers in the region of £X. Fixed price considered."
   - "Guide Price £X. Fixed price offers encouraged."
   - "Seller seeking quick sale at valuation"
   - "Motivated seller" combined with no closing date
   - Language suggesting flexibility: "open to offers", "negotiable", "flexible on price"
   - "Offers Over £X" but description emphasizes quick sale, relocation, or urgency
   
   Examples:
   - "Offers Over £200,000. Fixed price offers will be considered."
   - "Offers Over £175,000. Seller relocating and seeking quick sale."
   - "Guide Price £300,000. Fixed price offers welcome."
   - "Offers in the region of £220,000. No closing date set."

3. COMPETITIVE BIDDING ("competitive"):
   The listing clearly indicates a competitive bidding situation with no fixed price option.
   These are traditional Scottish property sales with competitive elements.
   
   Key Indicators:
   - "Closing date set" or "Closing date: [date]"
   - "Offers invited" (standalone, no fixed price mention)
   - "Offers Over £X" with closing date mentioned
   - "Highly sought after" or "Expected to exceed asking price"
   - "Multiple offers expected"
   - "Offers Over £X. Closing date [date]."
   - "Offers Over £X. Viewing by appointment only."
   - "Offers Over £X" with competitive language in description
   - "Guide Price £X" with closing date or competitive language
   - "Offers in excess of £X"
   - "Offers Over £X" with no mention of fixed price consideration
   - Generic "Offers Over" without any buyer-friendly language
   
   Examples:
   - "Offers Over £250,000. Closing date set for [date]."
   - "Offers Over £180,000. Highly sought after property."
   - "Offers invited. Closing date: [date]."
   - "Offers Over £300,000. Expected to exceed asking price."

CLASSIFICATION RULES:
- If price text contains "Fixed Price" explicitly → "explicit"
- If price text is just "£X" with no competitive language in description → "explicit"
- If description mentions "fixed price considered" or similar → "likely"
- If "closing date" is mentioned → "competitive" (unless explicitly overridden)
- If "offers over" with no fixed price mention and competitive language → "competitive"
- If "offers over" with buyer-friendly language (quick sale, no closing date) → "likely"
- When in doubt between "likely" and "competitive", choose "competitive" (conservative approach)
- When in doubt between "explicit" and "likely", choose "explicit" only if very clear

CONFIDENCE SCORING:
- 90-100: Very clear indicators, unambiguous language
- 70-89: Strong indicators with minor ambiguity
- 50-69: Moderate indicators, some ambiguity
- 30-49: Weak indicators, significant ambiguity
- 0-29: Very unclear, minimal indicators

Respond ONLY in valid JSON format with these exact fields:
{{
  "status": "explicit" | "likely" | "competitive",
  "confidence_score": <integer 0-100>,
  "reason": "<concise explanation (max 2 sentences) of classification decision>"
}}

JSON:
        """

        # Retry logic with exponential backoff
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant specialized in Scottish property market analysis."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                
                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Empty response from OpenAI API")
                
                # Type assertion: content is guaranteed to be str after None check
                result = json.loads(content)  # type: ignore[arg-type]
                
                status_map = {
                    "explicit": ClassificationStatus.EXPLICIT,
                    "likely": ClassificationStatus.LIKELY,
                    "competitive": ClassificationStatus.COMPETITIVE
                }
                
                status = status_map.get(result.get("status"), ClassificationStatus.COMPETITIVE)
                confidence = result.get("confidence_score", 0)
                reason = result.get("reason", "No reason provided.")
                
                return status, confidence, reason

            except RateLimitError as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    wait_time = self.rate_limit_delay * (attempt + 1)
                    logger.warning(f"Rate limit hit, waiting {wait_time}s before retry {attempt + 1}/{self.max_retries}")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Rate limit error after {self.max_retries} attempts: {e}")
                    return ClassificationStatus.COMPETITIVE, 0, f"Rate limit error: {str(e)}"
            
            except APIError as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"API error, waiting {wait_time}s before retry {attempt + 1}/{self.max_retries}: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"API error after {self.max_retries} attempts: {e}")
                    return ClassificationStatus.COMPETITIVE, 0, f"API error: {str(e)}"
            
            except (ValueError, json.JSONDecodeError) as e:
                # Don't retry for these errors
                logger.error(f"Error parsing classification response: {e}")
                return ClassificationStatus.COMPETITIVE, 0, f"Error parsing response: {str(e)}"
            
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    wait_time = self.retry_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Unexpected error, waiting {wait_time}s before retry {attempt + 1}/{self.max_retries}: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Error in AI classification after {self.max_retries} attempts: {e}")
                    return ClassificationStatus.COMPETITIVE, 0, f"Error processing: {str(e)}"
        
        # Should not reach here, but just in case
        return ClassificationStatus.COMPETITIVE, 0, f"Classification failed after {self.max_retries} attempts: {str(last_exception) if last_exception else 'Unknown error'}"

classification_service = ClassificationService()
