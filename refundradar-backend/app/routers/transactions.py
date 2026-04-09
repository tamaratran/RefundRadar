"""Transaction API routes."""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from typing import Optional
import aiosqlite

from app.database import get_db
from app.services.csv_parser import parse_bluevine_csv

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("")
async def list_transactions(
    category: Optional[str] = None,
    merchant: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
    db: aiosqlite.Connection = Depends(get_db),
):
    """List all transactions with optional filtering."""
    query = "SELECT * FROM transactions"
    params: list = []
    conditions = []

    if category:
        conditions.append("category = ?")
        params.append(category)
    if merchant:
        conditions.append("merchant LIKE ?")
        params.append(f"%{merchant}%")

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY date DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()

    transactions = []
    for row in rows:
        transactions.append({
            "id": row[0],
            "date": row[1],
            "description": row[2],
            "amount": row[3],
            "balance": row[4],
            "category": row[5],
            "merchant": row[6],
            "account_name": row[7],
            "source_file": row[8],
            "created_at": row[9],
        })

    # Get total count
    count_query = "SELECT COUNT(*) FROM transactions"
    if conditions:
        count_query += " WHERE " + " AND ".join(conditions)
    cursor = await db.execute(count_query, params[:-2] if params else [])
    total = (await cursor.fetchone())[0]

    return {"transactions": transactions, "total": total}


@router.get("/stats")
async def transaction_stats(db: aiosqlite.Connection = Depends(get_db)):
    """Get transaction statistics."""
    # Total transactions
    cursor = await db.execute("SELECT COUNT(*) FROM transactions")
    total = (await cursor.fetchone())[0]

    # Total spending (debits)
    cursor = await db.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount < 0")
    total_spending = abs((await cursor.fetchone())[0])

    # By category
    cursor = await db.execute(
        "SELECT category, COUNT(*), COALESCE(SUM(amount), 0) FROM transactions GROUP BY category ORDER BY SUM(amount)"
    )
    categories = [
        {"category": row[0], "count": row[1], "total": round(abs(row[2]), 2)}
        for row in await cursor.fetchall()
    ]

    # By merchant (top 20 by spending)
    cursor = await db.execute(
        "SELECT merchant, COUNT(*), COALESCE(SUM(amount), 0) FROM transactions "
        "WHERE amount < 0 GROUP BY merchant ORDER BY SUM(amount) LIMIT 20"
    )
    merchants = [
        {"merchant": row[0], "count": row[1], "total": round(abs(row[2]), 2)}
        for row in await cursor.fetchall()
    ]

    # Monthly spending trend
    cursor = await db.execute(
        "SELECT substr(date, 1, 7) as month, COALESCE(SUM(amount), 0) FROM transactions "
        "WHERE amount < 0 GROUP BY month ORDER BY month"
    )
    monthly = [
        {"month": row[0], "total": round(abs(row[1]), 2)}
        for row in await cursor.fetchall()
    ]

    # Unique accounts
    cursor = await db.execute("SELECT DISTINCT account_name FROM transactions WHERE account_name != ''")
    accounts = [row[0] for row in await cursor.fetchall()]

    return {
        "total_transactions": total,
        "total_spending": round(total_spending, 2),
        "categories": categories,
        "top_merchants": merchants,
        "monthly_spending": monthly,
        "accounts": accounts,
    }


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Upload and parse a CSV bank statement."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    text = content.decode("utf-8")

    transactions = parse_bluevine_csv(text, source_file=file.filename)

    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions found in the CSV file")

    inserted = 0
    for t in transactions:
        await db.execute(
            """INSERT INTO transactions (date, description, amount, balance, category, merchant, account_name, source_file)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (t["date"], t["description"], t["amount"], t["balance"],
             t["category"], t["merchant"], t["account_name"], t["source_file"]),
        )
        inserted += 1

    await db.commit()

    return {
        "message": f"Successfully imported {inserted} transactions from {file.filename}",
        "count": inserted,
    }


@router.delete("")
async def clear_transactions(db: aiosqlite.Connection = Depends(get_db)):
    """Clear all transactions."""
    await db.execute("DELETE FROM transactions")
    await db.execute("DELETE FROM refund_opportunities")
    await db.commit()
    return {"message": "All transactions and opportunities cleared"}
