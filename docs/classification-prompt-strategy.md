# Classification Prompt Strategy

## Overview

This document outlines the prompt engineering strategy for classifying Scottish property listings into three categories: **Explicit Fixed Price**, **Likely Fixed Price**, and **Competitive Bidding**.

## Classification Categories

### 1. Explicit Fixed Price (`explicit`)

**Definition**: The listing clearly and unambiguously states a fixed price with no competitive bidding language.

**Key Indicators**:
- "Fixed Price £X" or "Fixed Price: £X"
- "£X" with no "offers over", "offers invited", or "closing date" language
- "Price: £X" (standalone, no competitive language)
- "Asking Price: £X" (when no competitive indicators present)
- "Offers in the region of £X" (when clearly indicating fixed price intent)
- "Guide Price: £X" (when no competitive language)
- Explicit statements like "No offers over", "Fixed at £X", "Price set at £X"

**Examples**:
```
✅ "Fixed Price £250,000"
✅ "£180,000" (with description mentioning quick sale, no offers language)
✅ "Price: £320,000. Seller seeking quick sale."
✅ "Asking Price £195,000. No closing date set."
```

**Confidence Range**: 85-100 (high confidence when explicit)

---

### 2. Likely Fixed Price (`likely`)

**Definition**: The listing suggests willingness to accept fixed price but uses ambiguous or mixed language. These are buyer-friendly listings where fixed price is possible but not explicitly guaranteed.

**Key Indicators**:
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

**Examples**:
```
✅ "Offers Over £200,000. Fixed price offers will be considered."
✅ "Offers Over £175,000. Seller relocating and seeking quick sale."
✅ "Guide Price £300,000. Fixed price offers welcome."
✅ "Offers in the region of £220,000. No closing date set."
```

**Confidence Range**: 60-85 (moderate to high confidence)

---

### 3. Competitive Bidding (`competitive`)

**Definition**: The listing clearly indicates a competitive bidding situation with no fixed price option. These are traditional Scottish property sales with competitive elements.

**Key Indicators**:
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

**Examples**:
```
✅ "Offers Over £250,000. Closing date set for [date]."
✅ "Offers Over £180,000. Highly sought after property."
✅ "Offers invited. Closing date: [date]."
✅ "Offers Over £300,000. Expected to exceed asking price."
```

**Confidence Range**: 70-100 (high confidence when competitive indicators are clear)

---

## Classification Rules

### Decision Tree

1. **Check for explicit fixed price language**
   - If price text contains "Fixed Price" explicitly → `explicit`
   - If price text is just "£X" with no competitive language → `explicit`

2. **Check for closing date**
   - If "closing date" is mentioned → `competitive` (unless explicitly overridden by fixed price language)

3. **Check for fixed price consideration**
   - If description mentions "fixed price considered" or similar → `likely`

4. **Check for competitive language**
   - If "offers over" with no fixed price mention and competitive language → `competitive`
   - If "offers over" with buyer-friendly language (quick sale, no closing date) → `likely`

5. **Default behavior**
   - When in doubt between "likely" and "competitive", choose `competitive` (conservative approach)
   - When in doubt between "explicit" and "likely", choose `explicit` only if very clear

### Edge Cases

- **"Offers Over" with no additional context**: Default to `competitive` unless description suggests otherwise
- **Mixed signals**: Prioritize explicit language over implied intent
- **Missing information**: If description is empty or minimal, rely primarily on price text
- **Ambiguous language**: Use confidence score to reflect uncertainty

---

## Confidence Scoring Guidelines

The confidence score (0-100) reflects how certain the classification is based on the indicators present:

- **90-100**: Very clear indicators, unambiguous language
  - Example: "Fixed Price £250,000" → 95
  - Example: "Offers Over £200,000. Closing date: 15th March." → 95

- **70-89**: Strong indicators with minor ambiguity
  - Example: "Offers Over £180,000. Fixed price considered." → 80
  - Example: "£200,000. Quick sale preferred." → 75

- **50-69**: Moderate indicators, some ambiguity
  - Example: "Offers Over £175,000. Seller relocating." → 65
  - Example: "Guide Price £300,000." → 60

- **30-49**: Weak indicators, significant ambiguity
  - Example: "Offers in the region of £220,000." → 45
  - Example: "Price on application" with minimal description → 35

- **0-29**: Very unclear, minimal indicators
  - Example: Very short description with no pricing language → 20

---

## Prompt Engineering Principles

1. **Specificity**: Provide detailed examples for each category
2. **Context**: Include Scottish property market context
3. **Clarity**: Use clear decision rules and indicators
4. **Consistency**: Ensure consistent classification across similar listings
5. **Confidence**: Encourage appropriate confidence scoring

---

## Testing Strategy

### Test Cases

#### Explicit Fixed Price Tests
1. "Fixed Price £250,000" → Should return `explicit` with high confidence
2. "£180,000" (no competitive language) → Should return `explicit` with high confidence
3. "Price: £320,000. Seller seeking quick sale." → Should return `explicit` with high confidence

#### Likely Fixed Price Tests
1. "Offers Over £200,000. Fixed price offers will be considered." → Should return `likely` with moderate-high confidence
2. "Offers Over £175,000. Seller relocating and seeking quick sale." → Should return `likely` with moderate confidence
3. "Guide Price £300,000. Fixed price offers welcome." → Should return `likely` with moderate-high confidence

#### Competitive Bidding Tests
1. "Offers Over £250,000. Closing date set for 15th March." → Should return `competitive` with high confidence
2. "Offers Over £180,000. Highly sought after property." → Should return `competitive` with high confidence
3. "Offers invited. Closing date: 20th April." → Should return `competitive` with high confidence

---

## Model Configuration

- **Model**: GPT-4o (recommended for 2026)
- **Response Format**: JSON object (enforced)
- **Temperature**: Default (0.7) - allows for nuanced understanding while maintaining consistency
- **Max Tokens**: Sufficient for structured JSON response

---

## Maintenance

### Regular Review
- Review classification accuracy monthly
- Adjust prompt based on edge cases encountered
- Update examples as new patterns emerge in the market

### Monitoring
- Track confidence score distribution
- Monitor misclassification rates
- Review user feedback on classification accuracy

---

## Version History

- **v1.0** (2026-01-24): Initial comprehensive prompt with detailed patterns and examples
  - Added explicit classification patterns
  - Added likely classification patterns  
  - Added competitive classification patterns
  - Implemented confidence scoring guidelines
  - Created decision tree rules
