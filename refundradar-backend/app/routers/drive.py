"""Google Drive API routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import os

from app.database import get_db
from app.services import google_drive
from app.services.csv_parser import parse_bluevine_csv

router = APIRouter(prefix="/api/drive", tags=["drive"])


class OAuthConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: str


class OAuthCallback(BaseModel):
    code: str
    client_id: str
    client_secret: str
    redirect_uri: str


@router.get("/status")
async def drive_status():
    """Check if Google Drive is connected."""
    creds = google_drive.get_credentials()
    return {"connected": creds is not None}


@router.post("/auth/url")
async def get_auth_url(config: OAuthConfig):
    """Get Google OAuth URL."""
    url = google_drive.get_oauth_url(
        client_id=config.client_id,
        client_secret=config.client_secret,
        redirect_uri=config.redirect_uri,
    )
    return {"url": url}


@router.post("/auth/callback")
async def oauth_callback(callback: OAuthCallback):
    """Handle OAuth callback."""
    try:
        tokens = google_drive.exchange_code(
            code=callback.code,
            client_id=callback.client_id,
            client_secret=callback.client_secret,
            redirect_uri=callback.redirect_uri,
        )
        return {"success": True, "message": "Google Drive connected successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")


@router.get("/files")
async def list_drive_files(
    folder_id: Optional[str] = None,
    file_type: Optional[str] = None,
):
    """List files in Google Drive."""
    files = google_drive.list_files(folder_id=folder_id, file_type=file_type)
    return {"files": files}


@router.get("/folders")
async def list_drive_folders(parent_id: Optional[str] = None):
    """List folders in Google Drive."""
    folders = google_drive.list_folders(parent_id=parent_id)
    return {"folders": folders}


@router.get("/search")
async def search_drive(query: str = Query(...)):
    """Search for files in Google Drive."""
    files = google_drive.search_files(query)
    return {"files": files}


@router.post("/import/{file_id}")
async def import_file(
    file_id: str,
    file_name: str = "",
    db: aiosqlite.Connection = Depends(get_db),
):
    """Import a CSV file from Google Drive."""
    # Check if already synced
    cursor = await db.execute(
        "SELECT id FROM drive_sync WHERE file_id = ?", (file_id,)
    )
    if await cursor.fetchone():
        return {"message": f"File {file_name} has already been imported", "count": 0}

    # Download file
    content = google_drive.download_file(file_id)
    if not content:
        raise HTTPException(status_code=400, detail="Could not download file from Google Drive")

    text = content.decode("utf-8")
    transactions = parse_bluevine_csv(text, source_file=file_name)

    if not transactions:
        raise HTTPException(status_code=400, detail="No transactions found in file")

    inserted = 0
    for t in transactions:
        await db.execute(
            """INSERT INTO transactions (date, description, amount, balance, category, merchant, account_name, source_file)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (t["date"], t["description"], t["amount"], t["balance"],
             t["category"], t["merchant"], t["account_name"], t["source_file"]),
        )
        inserted += 1

    # Record sync
    await db.execute(
        "INSERT INTO drive_sync (file_id, file_name, transaction_count) VALUES (?, ?, ?)",
        (file_id, file_name, inserted),
    )
    await db.commit()

    return {"message": f"Imported {inserted} transactions from {file_name}", "count": inserted}
