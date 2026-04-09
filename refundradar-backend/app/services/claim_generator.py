"""Generate refund claim emails and letters."""
import json
from typing import Any


def generate_claim(opportunity: dict[str, Any]) -> str:
    """Generate a claim email/letter based on the opportunity type."""
    opp_type = opportunity.get("type", "")
    details = {}
    if opportunity.get("details"):
        try:
            details = json.loads(opportunity["details"])
        except (json.JSONDecodeError, TypeError):
            pass

    generators = {
        "subscription_overcharge": _generate_subscription_claim,
        "duplicate_charge": _generate_duplicate_claim,
        "price_increase": _generate_price_increase_claim,
        "forgotten_subscription": _generate_cancellation_request,
    }

    generator = generators.get(opp_type, _generate_generic_claim)
    return generator(opportunity, details)


def _generate_subscription_claim(opportunity: dict[str, Any], details: dict[str, Any]) -> str:
    merchant = details.get("merchant", "your company")
    prev = details.get("previous_amount", 0)
    current = details.get("current_amount", 0)
    increase = details.get("monthly_increase", current - prev)

    return f"""Subject: Request for Price Adjustment — Account Subscription

Dear {merchant} Customer Support,

I am writing to request a review of my account billing. I have noticed that my monthly charge has increased from ${prev:.2f} to ${current:.2f}, representing an increase of ${increase:.2f} per month.

I was not notified of this price change and would like to request one of the following:
1. A credit for the difference since the price increase began
2. Restoration of my previous rate of ${prev:.2f}/month
3. Information about any promotional rates currently available

I have been a loyal customer and would appreciate your assistance in resolving this matter.

Thank you for your time and attention to this matter.

Best regards,
[Your Name]
[Your Account Number/Email]"""


def _generate_duplicate_claim(opportunity: dict[str, Any], details: dict[str, Any]) -> str:
    merchant = details.get("merchant", "your company")
    amount = abs(details.get("amount", 0))
    dates = details.get("dates", [])
    date_str = " and ".join(dates) if dates else "recently"

    return f"""Subject: Duplicate Charge Dispute — Requesting Refund

Dear {merchant} Customer Support,

I have identified what appears to be a duplicate charge on my account:

- Amount: ${amount:.2f}
- Dates charged: {date_str}

I was charged the same amount of ${amount:.2f} on both dates for what appears to be the same transaction. I am requesting a refund of ${amount:.2f} for the duplicate charge.

Please investigate this matter and issue a credit to my account at your earliest convenience.

If you need any additional information to process this refund, please do not hesitate to contact me.

Thank you,
[Your Name]
[Your Account Number/Email]"""


def _generate_price_increase_claim(opportunity: dict[str, Any], details: dict[str, Any]) -> str:
    merchant = details.get("merchant", "your company")
    median = details.get("median_amount", 0)
    recent = details.get("recent_amount", 0)

    return f"""Subject: Unexpected Price Increase — Requesting Adjustment

Dear {merchant} Customer Support,

I am writing regarding an unexpected increase in my recent charge. My typical charge has been approximately ${median:.2f}, but my most recent charge was ${recent:.2f}.

I would appreciate if you could:
1. Explain the reason for the increase
2. Apply any available discounts or credits
3. Restore my previous rate if this was an error

I value my relationship with {merchant} and hope we can resolve this promptly.

Thank you,
[Your Name]
[Your Account Number/Email]"""


def _generate_cancellation_request(opportunity: dict[str, Any], details: dict[str, Any]) -> str:
    merchant = details.get("merchant", "your company")
    monthly = details.get("monthly_cost", 0)
    months = details.get("months_active", 0)
    annual = details.get("annual_cost", 0)

    return f"""Subject: Subscription Review and Potential Cancellation

Dear {merchant} Customer Support,

I am reviewing my recurring subscriptions and noticed that I have been subscribed to your service for approximately {months} months at ~${monthly:.2f}/month (${annual:.0f}/year).

I would like to:
1. Understand what my current plan includes
2. Know if there are any lower-tier plans available
3. Understand the cancellation process if I decide to discontinue

If there are any retention offers or promotional rates available, I would be happy to consider them before making a final decision.

Thank you,
[Your Name]
[Your Account Number/Email]"""


def _generate_generic_claim(opportunity: dict[str, Any], details: dict[str, Any]) -> str:
    desc = opportunity.get("description", "a billing issue")
    savings = opportunity.get("potential_savings", 0)

    return f"""Subject: Billing Inquiry — Requesting Review

Dear Customer Support,

I am writing regarding the following billing concern: {desc}

The estimated amount in question is ${savings:.2f}.

I would appreciate your assistance in reviewing this matter and providing a resolution, which may include a credit, refund, or rate adjustment.

Please let me know if you need any additional information from my end.

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]
[Your Account Number/Email]"""
