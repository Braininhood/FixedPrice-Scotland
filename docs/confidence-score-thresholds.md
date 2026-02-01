# Confidence Score Thresholds

## Overview

This document defines the confidence score thresholds used in the classification system. Confidence scores range from 0-100 and indicate how certain the AI model is about its classification decision.

## Confidence Score Ranges

### High Confidence (70-100)

**Definition**: Strong indicators present with minimal ambiguity. Classification is highly reliable.

**Characteristics**:
- Clear, unambiguous language
- Multiple indicators supporting the classification
- Minimal conflicting signals
- Well-documented patterns match the listing

**Usage**:
- These classifications can be trusted for filtering and user display
- Suitable for premium features and recommendations
- Low risk of misclassification

**Examples**:
- "Fixed Price £250,000" → 95 (explicit)
- "Offers Over £200,000. Closing date: 15th March." → 95 (competitive)
- "Offers Over £180,000. Fixed price offers will be considered." → 80 (likely)

---

### Medium Confidence (50-69)

**Definition**: Moderate indicators present with some ambiguity. Classification is reasonably reliable but may need review.

**Characteristics**:
- Some clear indicators present
- Minor conflicting signals
- Partial pattern matches
- Some uncertainty in interpretation

**Usage**:
- These classifications are generally reliable
- May benefit from manual review in edge cases
- Suitable for general filtering
- Consider flagging for review if confidence is below 60

**Examples**:
- "Offers Over £175,000. Seller relocating." → 65 (likely)
- "Guide Price £300,000." → 60 (explicit/likely - depends on context)
- "£200,000. Quick sale preferred." → 75 (explicit)

---

### Low Confidence (30-49)

**Definition**: Weak indicators with significant ambiguity. Classification is uncertain and should be reviewed.

**Characteristics**:
- Few clear indicators
- Significant conflicting signals
- Ambiguous language
- Unclear intent

**Usage**:
- These classifications should be flagged for manual review
- May need additional context or human verification
- Use with caution in filtering
- Consider excluding from premium features

**Examples**:
- "Offers in the region of £220,000." → 45 (ambiguous)
- "Price on application" with minimal description → 35 (very unclear)
- Mixed signals with no clear pattern → 40

---

### Very Low Confidence (0-29)

**Definition**: Very unclear with minimal indicators. Classification is highly uncertain.

**Characteristics**:
- Very few or no clear indicators
- Highly ambiguous language
- Missing critical information
- Cannot determine with reasonable certainty

**Usage**:
- These classifications should be flagged for mandatory review
- Exclude from automated filtering
- Require manual classification
- Do not use for premium features

**Examples**:
- Very short description with no pricing language → 20
- Missing price and description → 15
- Completely ambiguous listing → 25

---

## Threshold Recommendations

### For Filtering

- **High Confidence Only**: Use scores ≥ 70 for strict filtering
  - Best for premium features
  - Low false positive rate
  - High user trust

- **Medium+ Confidence**: Use scores ≥ 50 for general filtering
  - Balanced approach
  - Good coverage
  - Acceptable accuracy

- **All Classifications**: Use all scores (with review flags)
  - Maximum coverage
  - Requires review system
  - Best for comprehensive listings

### For Display

- **Show Confidence Badge**: Display confidence level to users
  - High: "High Confidence" badge
  - Medium: "Moderate Confidence" badge
  - Low: "Review Pending" badge

- **Filter by Confidence**: Allow users to filter by confidence level
  - Premium feature: Filter by high confidence only
  - Standard: Show all with confidence indicators

### For Review Queue

- **Mandatory Review**: Scores < 50
  - All low confidence classifications
  - Flagged for human review
  - Priority queue

- **Optional Review**: Scores 50-69
  - Medium confidence classifications
  - Spot check recommended
  - Lower priority

- **No Review Needed**: Scores ≥ 70
  - High confidence classifications
  - Automated processing
  - Review only on user reports

---

## Calibration Guidelines

### Testing Confidence Scores

1. **Collect Sample Data**: Gather 100+ real listings across all categories
2. **Manual Classification**: Have experts classify listings manually
3. **Compare Results**: Compare AI classifications with manual classifications
4. **Calculate Accuracy**: Measure accuracy at different confidence thresholds
5. **Adjust Thresholds**: Fine-tune thresholds based on accuracy data

### Expected Accuracy Rates

Based on confidence score ranges:

- **90-100**: 95%+ accuracy expected
- **70-89**: 85-95% accuracy expected
- **50-69**: 70-85% accuracy expected
- **30-49**: 50-70% accuracy expected
- **0-29**: <50% accuracy expected

### Calibration Process

1. **Initial Testing**: Test with 50-100 listings
2. **Measure Accuracy**: Calculate accuracy by confidence range
3. **Identify Issues**: Find patterns in misclassifications
4. **Adjust Prompt**: Refine prompt based on findings
5. **Re-test**: Validate improvements
6. **Document Changes**: Update thresholds and guidelines

---

## Monitoring

### Metrics to Track

- **Average Confidence Score**: Overall confidence distribution
- **Accuracy by Range**: Accuracy for each confidence range
- **Misclassification Rate**: Rate of incorrect classifications
- **Review Queue Size**: Number of listings requiring review
- **User Feedback**: User reports of incorrect classifications

### Review Process

1. **Daily Monitoring**: Check review queue daily
2. **Weekly Analysis**: Analyze accuracy metrics weekly
3. **Monthly Calibration**: Review and adjust thresholds monthly
4. **Quarterly Audit**: Comprehensive accuracy audit quarterly

---

## Version History

- **v1.0** (2026-01-24): Initial confidence score thresholds
  - Defined high (70-100), medium (50-69), low (30-49), very low (0-29) ranges
  - Established usage guidelines for filtering and display
  - Created review queue recommendations
  - Documented calibration process
