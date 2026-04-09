"""Parse Bluevine bank statement CSV files."""
import csv
import io
from typing import Any


def parse_bluevine_csv(content: str, source_file: str = "") -> list[dict[str, Any]]:
    """Parse a Bluevine bank statement CSV and return transaction dicts.

    Expected columns: Date, Description, Debit/Credit, Balance, Name,
    Additional information, IMAD/trace ID, Bill due date, Bill number, Bill notes
    """
    transactions: list[dict[str, Any]] = []
    reader = csv.DictReader(io.StringIO(content))

    for row in reader:
        date = row.get("Date", "").strip()
        description = row.get("Description", "").strip()
        amount_str = row.get("Debit/Credit", "0").strip()
        balance_str = row.get("Balance", "").strip()
        name = row.get("Name", "").strip()

        if not date or not description:
            continue

        try:
            amount = float(amount_str) if amount_str else 0.0
        except ValueError:
            amount = 0.0

        try:
            balance = float(balance_str) if balance_str else None
        except ValueError:
            balance = None

        merchant = _extract_merchant(description)
        category = _categorize_transaction(description, merchant)

        transactions.append({
            "date": date,
            "description": description,
            "amount": amount,
            "balance": balance,
            "merchant": merchant,
            "category": category,
            "account_name": name or _extract_account_from_filename(source_file),
            "source_file": source_file,
        })

    return transactions


def _extract_merchant(description: str) -> str:
    """Extract merchant name from transaction description."""
    desc_upper = description.upper()

    merchant_map = {
        "PAYPAL": "PayPal",
        "GOOGLE*CLOUD": "Google Cloud",
        "GOOGLE CLOUD": "Google Cloud",
        "APPLE.COM/BILL": "Apple",
        "APPLE COM BILL": "Apple",
        "LEMONADE INSUR": "Lemonade Insurance",
        "WEWORK": "WeWork",
        "TASKRABBIT": "TaskRabbit",
        "AMAZON": "Amazon",
        "NETFLIX": "Netflix",
        "SPOTIFY": "Spotify",
        "UBER": "Uber",
        "LYFT": "Lyft",
        "DOORDASH": "DoorDash",
        "GRUBHUB": "Grubhub",
        "POSTMATES": "Postmates",
        "INSTACART": "Instacart",
        "WALMART": "Walmart",
        "TARGET": "Target",
        "COSTCO": "Costco",
        "WHOLE FOODS": "Whole Foods",
        "TRADER JOE": "Trader Joe's",
        "STARBUCKS": "Starbucks",
        "CHIPOTLE": "Chipotle",
        "STRIPE": "Stripe",
        "SHOPIFY": "Shopify",
        "HEROKU": "Heroku",
        "DIGITALOCEAN": "DigitalOcean",
        "AWS": "Amazon Web Services",
        "MICROSOFT": "Microsoft",
        "ADOBE": "Adobe",
        "SLACK": "Slack",
        "ZOOM": "Zoom",
        "OPENAI": "OpenAI",
        "CHATGPT": "OpenAI",
        "HULU": "Hulu",
        "DISNEY": "Disney+",
        "HBO": "HBO Max",
        "YOUTUBE": "YouTube",
        "TWITCH": "Twitch",
    }

    for key, value in merchant_map.items():
        if key in desc_upper:
            return value

    # Fall back to cleaning up the description
    parts = description.split()
    if parts:
        return " ".join(parts[:3]).title()
    return description


def _categorize_transaction(description: str, merchant: str) -> str:
    """Categorize a transaction based on description and merchant."""
    desc_upper = description.upper()
    merchant_upper = merchant.upper()

    subscription_keywords = [
        "NETFLIX", "SPOTIFY", "HULU", "DISNEY", "HBO", "YOUTUBE",
        "APPLE.COM/BILL", "APPLE COM BILL", "GOOGLE*CLOUD", "GOOGLE CLOUD",
        "MICROSOFT", "ADOBE", "SLACK", "ZOOM", "OPENAI", "CHATGPT",
        "HEROKU", "DIGITALOCEAN", "AWS", "WEWORK", "LEMONADE",
        "INSURANCE", "SUBSCRIPTION", "MONTHLY", "RECURRING",
    ]
    for kw in subscription_keywords:
        if kw in desc_upper or kw in merchant_upper:
            return "subscription"

    if any(kw in desc_upper for kw in ["RESTAURANT", "CAFE", "COFFEE", "PIZZA",
                                        "BURGER", "SUSHI", "TACO", "CHIPOTLE",
                                        "STARBUCKS", "MCDONALDS", "GRUBHUB",
                                        "DOORDASH", "POSTMATES", "UBER EATS",
                                        "TOCAYA"]):
        return "dining"

    if any(kw in desc_upper for kw in ["AMAZON", "WALMART", "TARGET", "COSTCO",
                                        "WHOLE FOODS", "TRADER JOE", "INSTACART",
                                        "SHOP", "STORE", "MARKET"]):
        return "retail"

    if any(kw in desc_upper for kw in ["UBER", "LYFT", "TAXI", "TRANSIT",
                                        "METRO", "GAS", "SHELL", "CHEVRON",
                                        "BP ", "EXXON"]):
        return "transport"

    if any(kw in desc_upper for kw in ["TRANSFER", "BLUEVINE PAY"]):
        return "transfer"

    if any(kw in desc_upper for kw in ["PAYPAL"]):
        return "payment_service"

    if any(kw in desc_upper for kw in ["INTEREST"]):
        return "interest"

    return "other"


def _extract_account_from_filename(filename: str) -> str:
    """Extract account name from filename like 'Bluevine_Checking_5570_transactions.csv'."""
    if not filename:
        return ""
    name = filename.replace("_transactions.csv", "").replace("_", " ")
    return name
