"""Analyze transactions to find refund opportunities."""
import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any


def analyze_transactions(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Analyze all transactions and return refund opportunities."""
    opportunities: list[dict[str, Any]] = []

    opportunities.extend(_detect_subscription_overcharges(transactions))
    opportunities.extend(_detect_duplicate_charges(transactions))
    opportunities.extend(_detect_price_increases(transactions))
    opportunities.extend(_detect_forgotten_subscriptions(transactions))

    return opportunities


def _detect_subscription_overcharges(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Detect subscriptions that have increased in price."""
    opportunities: list[dict[str, Any]] = []

    # Group subscription transactions by merchant
    sub_transactions = [t for t in transactions if t.get("category") == "subscription"]
    by_merchant: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for t in sub_transactions:
        merchant = t.get("merchant", "Unknown")
        by_merchant[merchant].append(t)

    for merchant, txns in by_merchant.items():
        # Sort by date
        sorted_txns = sorted(txns, key=lambda x: x.get("date", ""))
        if len(sorted_txns) < 2:
            continue

        debit_txns = [(t, abs(t["amount"])) for t in sorted_txns if t["amount"] < 0]
        if len(debit_txns) < 2:
            continue

        amounts = [amt for _, amt in debit_txns]

        # Check if the most recent charge is higher than the previous average
        recent_amount = amounts[-1]
        previous_avg = sum(amounts[:-1]) / len(amounts[:-1])

        if recent_amount > previous_avg * 1.05:  # 5% threshold
            increase = recent_amount - previous_avg
            recent_txn = debit_txns[-1][0]
            opportunities.append({
                "transaction_id": recent_txn.get("id"),
                "type": "subscription_overcharge",
                "description": f"{merchant} increased from ${previous_avg:.2f} to ${recent_amount:.2f}/month",
                "potential_savings": round(increase * 12, 2),  # Annual savings
                "confidence": "high" if increase > 1.0 else "medium",
                "details": json.dumps({
                    "merchant": merchant,
                    "previous_amount": round(previous_avg, 2),
                    "current_amount": round(recent_amount, 2),
                    "monthly_increase": round(increase, 2),
                    "recent_transactions": [
                        {"date": t["date"], "amount": t["amount"]}
                        for t in sorted_txns[-5:]
                    ],
                }),
            })

    return opportunities


def _detect_duplicate_charges(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Detect potential duplicate charges (same merchant, same amount, same day or adjacent days)."""
    opportunities: list[dict[str, Any]] = []
    seen: set[str] = set()

    sorted_txns = sorted(transactions, key=lambda x: (x.get("date", ""), x.get("merchant", "")))

    for i, t1 in enumerate(sorted_txns):
        if t1["amount"] >= 0:  # Only look at debits
            continue

        for j in range(i + 1, min(i + 10, len(sorted_txns))):
            t2 = sorted_txns[j]
            if t2["amount"] >= 0:
                continue

            # Same merchant, same amount
            if (t1.get("merchant") == t2.get("merchant") and
                    abs(t1["amount"] - t2["amount"]) < 0.01):

                try:
                    d1 = datetime.strptime(t1["date"], "%Y-%m-%d")
                    d2 = datetime.strptime(t2["date"], "%Y-%m-%d")
                    if abs((d2 - d1).days) <= 3:
                        key = f"{t1['merchant']}_{t1['date']}_{t2['date']}_{t1['amount']}"
                        if key not in seen:
                            seen.add(key)
                            opportunities.append({
                                "transaction_id": t2.get("id"),
                                "type": "duplicate_charge",
                                "description": f"Possible duplicate charge at {t1.get('merchant', 'Unknown')}: "
                                               f"${abs(t1['amount']):.2f} on {t1['date']} and {t2['date']}",
                                "potential_savings": round(abs(t1["amount"]), 2),
                                "confidence": "high" if (d2 - d1).days == 0 else "medium",
                                "details": json.dumps({
                                    "merchant": t1.get("merchant"),
                                    "amount": t1["amount"],
                                    "dates": [t1["date"], t2["date"]],
                                    "descriptions": [t1["description"], t2["description"]],
                                }),
                            })
                except ValueError:
                    continue

    return opportunities


def _detect_price_increases(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Detect significant price increases for recurring services."""
    opportunities: list[dict[str, Any]] = []

    # Group all debits by merchant
    by_merchant: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for t in transactions:
        if t["amount"] < 0 and t.get("merchant"):
            by_merchant[t["merchant"]].append(t)

    for merchant, txns in by_merchant.items():
        sorted_txns = sorted(txns, key=lambda x: x.get("date", ""))
        if len(sorted_txns) < 3:
            continue

        amounts = [abs(t["amount"]) for t in sorted_txns]
        if not amounts:
            continue

        # Check if the most recent charge is significantly higher than the median
        sorted_amounts = sorted(amounts)
        median = sorted_amounts[len(sorted_amounts) // 2]
        recent = amounts[-1]

        if recent > median * 1.20 and recent - median > 5.0:  # 20% increase and > $5
            opportunities.append({
                "transaction_id": sorted_txns[-1].get("id"),
                "type": "price_increase",
                "description": f"{merchant} charge jumped from ~${median:.2f} to ${recent:.2f}",
                "potential_savings": round(recent - median, 2),
                "confidence": "medium",
                "details": json.dumps({
                    "merchant": merchant,
                    "median_amount": round(median, 2),
                    "recent_amount": round(recent, 2),
                    "history": [
                        {"date": t["date"], "amount": t["amount"]}
                        for t in sorted_txns[-6:]
                    ],
                }),
            })

    return opportunities


def _detect_forgotten_subscriptions(transactions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Detect subscriptions that might be forgotten (recurring small charges)."""
    opportunities: list[dict[str, Any]] = []

    # Group subscription transactions by merchant
    sub_transactions = [t for t in transactions if t.get("category") == "subscription" and t["amount"] < 0]
    by_merchant: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for t in sub_transactions:
        merchant = t.get("merchant", "Unknown")
        by_merchant[merchant].append(t)

    for merchant, txns in by_merchant.items():
        sorted_txns = sorted(txns, key=lambda x: x.get("date", ""))
        if len(sorted_txns) < 3:
            continue

        # Check if the subscription has been going on for a while
        try:
            first_date = datetime.strptime(sorted_txns[0]["date"], "%Y-%m-%d")
            last_date = datetime.strptime(sorted_txns[-1]["date"], "%Y-%m-%d")
            months_active = (last_date - first_date).days / 30

            if months_active >= 6:
                monthly_cost = abs(sum(t["amount"] for t in sorted_txns)) / max(months_active, 1)
                annual_cost = monthly_cost * 12

                if annual_cost > 50:  # Only flag if > $50/year
                    opportunities.append({
                        "transaction_id": sorted_txns[-1].get("id"),
                        "type": "forgotten_subscription",
                        "description": f"{merchant}: ~${monthly_cost:.2f}/mo for {int(months_active)} months "
                                       f"(${annual_cost:.0f}/year) — still needed?",
                        "potential_savings": round(annual_cost, 2),
                        "confidence": "low",
                        "details": json.dumps({
                            "merchant": merchant,
                            "monthly_cost": round(monthly_cost, 2),
                            "annual_cost": round(annual_cost, 2),
                            "months_active": int(months_active),
                            "charge_count": len(sorted_txns),
                            "first_charge": sorted_txns[0]["date"],
                            "last_charge": sorted_txns[-1]["date"],
                        }),
                    })
        except ValueError:
            continue

    return opportunities
