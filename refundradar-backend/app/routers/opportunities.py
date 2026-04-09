"""Refund opportunity API routes."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import aiosqlite
import json

from app.database import get_db
from app.services.analyzer import analyze_transactions
from app.services.claim_generator import generate_claim

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.get("")
async def list_opportunities(
    status: Optional[str] = None,
    opp_type: Optional[str] = None,
    db: aiosqlite.Connection = Depends(get_db),
):
    """List all refund opportunities."""
    query = "SELECT * FROM refund_opportunities"
    params: list = []
    conditions = []

    if status:
        conditions.append("status = ?")
        params.append(status)
    if opp_type:
        conditions.append("type = ?")
        params.append(opp_type)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY potential_savings DESC"

    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()

    opportunities = []
    for row in rows:
        details = None
        if row[8]:
            try:
                details = json.loads(row[8])
            except (json.JSONDecodeError, TypeError):
                details = row[8]

        opportunities.append({
            "id": row[0],
            "transaction_id": row[1],
            "type": row[2],
            "description": row[3],
            "potential_savings": row[4],
            "status": row[5],
            "confidence": row[6],
            "details": details,
            "claim_template": row[9] if len(row) > 9 else None,
            "created_at": row[10] if len(row) > 10 else None,
        })

    return {"opportunities": opportunities, "total": len(opportunities)}


@router.get("/summary")
async def opportunity_summary(db: aiosqlite.Connection = Depends(get_db)):
    """Get summary of all refund opportunities."""
    cursor = await db.execute(
        "SELECT type, COUNT(*), COALESCE(SUM(potential_savings), 0) "
        "FROM refund_opportunities GROUP BY type"
    )
    by_type = [
        {"type": row[0], "count": row[1], "total_savings": round(row[2], 2)}
        for row in await cursor.fetchall()
    ]

    cursor = await db.execute(
        "SELECT COALESCE(SUM(potential_savings), 0) FROM refund_opportunities"
    )
    total_savings = round((await cursor.fetchone())[0], 2)

    cursor = await db.execute("SELECT COUNT(*) FROM refund_opportunities")
    total_count = (await cursor.fetchone())[0]

    cursor = await db.execute(
        "SELECT status, COUNT(*) FROM refund_opportunities GROUP BY status"
    )
    by_status = {row[0]: row[1] for row in await cursor.fetchall()}

    return {
        "total_savings": total_savings,
        "total_opportunities": total_count,
        "by_type": by_type,
        "by_status": by_status,
    }


@router.post("/analyze")
async def run_analysis(db: aiosqlite.Connection = Depends(get_db)):
    """Run analysis on all transactions to find refund opportunities."""
    # Fetch all transactions
    cursor = await db.execute("SELECT * FROM transactions ORDER BY date")
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
        })

    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions to analyze. Upload bank statements first.")

    # Run analysis
    opportunities = analyze_transactions(transactions)

    # Clear old opportunities and insert new ones
    await db.execute("DELETE FROM refund_opportunities")

    for opp in opportunities:
        claim = generate_claim(opp)
        await db.execute(
            """INSERT INTO refund_opportunities
               (transaction_id, type, description, potential_savings, confidence, details, claim_template)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (opp.get("transaction_id"), opp["type"], opp["description"],
             opp["potential_savings"], opp.get("confidence", "medium"),
             opp.get("details"), claim),
        )

    await db.commit()

    return {
        "message": f"Analysis complete. Found {len(opportunities)} refund opportunities.",
        "count": len(opportunities),
        "total_savings": round(sum(o["potential_savings"] for o in opportunities), 2),
    }


@router.put("/{opportunity_id}/status")
async def update_opportunity_status(
    opportunity_id: int,
    status: str,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Update the status of an opportunity (detected, claimed, resolved, dismissed)."""
    valid_statuses = ["detected", "claimed", "resolved", "dismissed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    await db.execute(
        "UPDATE refund_opportunities SET status = ? WHERE id = ?",
        (status, opportunity_id),
    )
    await db.commit()
    return {"message": f"Opportunity {opportunity_id} status updated to {status}"}


@router.get("/{opportunity_id}/claim")
async def get_claim_template(
    opportunity_id: int,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Get the claim email template for an opportunity."""
    cursor = await db.execute(
        "SELECT * FROM refund_opportunities WHERE id = ?", (opportunity_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {
        "opportunity_id": row[0],
        "type": row[2],
        "description": row[3],
        "claim_template": row[9] if len(row) > 9 else "",
    }
