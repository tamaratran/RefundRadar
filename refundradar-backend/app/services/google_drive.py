"""Google Drive integration for scanning bank statements."""
import json
from typing import Any, Optional

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# Store tokens in memory for now (in production, use secure storage)
_tokens: dict[str, Any] = {}


def get_oauth_url(client_id: str, client_secret: str, redirect_uri: str) -> str:
    """Generate Google OAuth URL for Drive access."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def exchange_code(code: str, client_id: str, client_secret: str, redirect_uri: str) -> dict[str, Any]:
    """Exchange authorization code for tokens."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )
    flow.fetch_token(code=code)
    creds = flow.credentials
    token_data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes) if creds.scopes else SCOPES,
    }
    _tokens["default"] = token_data
    return token_data


def get_credentials() -> Optional[Credentials]:
    """Get stored credentials."""
    token_data = _tokens.get("default")
    if not token_data:
        return None
    return Credentials(
        token=token_data["token"],
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data.get("client_id"),
        client_secret=token_data.get("client_secret"),
        scopes=token_data.get("scopes", SCOPES),
    )


def list_files(folder_id: Optional[str] = None, file_type: Optional[str] = None) -> list[dict[str, Any]]:
    """List files in Google Drive, optionally filtered by folder and type."""
    creds = get_credentials()
    if not creds:
        return []

    service = build("drive", "v3", credentials=creds)

    query_parts = []
    if folder_id:
        query_parts.append(f"'{folder_id}' in parents")
    if file_type == "csv":
        query_parts.append("mimeType='text/csv'")
    elif file_type == "pdf":
        query_parts.append("mimeType='application/pdf'")

    query_parts.append("trashed=false")
    query = " and ".join(query_parts)

    results = service.files().list(
        q=query,
        pageSize=100,
        fields="files(id, name, mimeType, size, modifiedTime, parents)",
        orderBy="modifiedTime desc",
    ).execute()

    return results.get("files", [])


def search_files(query_text: str) -> list[dict[str, Any]]:
    """Search for files by name in Google Drive."""
    creds = get_credentials()
    if not creds:
        return []

    service = build("drive", "v3", credentials=creds)
    escaped_query = query_text.replace("\\", "\\\\").replace("'", "\\'")
    query = f"name contains '{escaped_query}' and trashed=false"

    results = service.files().list(
        q=query,
        pageSize=100,
        fields="files(id, name, mimeType, size, modifiedTime, parents)",
        orderBy="modifiedTime desc",
    ).execute()

    return results.get("files", [])


def download_file(file_id: str) -> Optional[bytes]:
    """Download a file from Google Drive."""
    creds = get_credentials()
    if not creds:
        return None

    service = build("drive", "v3", credentials=creds)
    request = service.files().get_media(fileId=file_id)

    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)

    done = False
    while not done:
        _, done = downloader.next_chunk()

    return buffer.getvalue()


def list_folders(parent_id: Optional[str] = None) -> list[dict[str, Any]]:
    """List folders in Google Drive."""
    creds = get_credentials()
    if not creds:
        return []

    service = build("drive", "v3", credentials=creds)

    query_parts = ["mimeType='application/vnd.google-apps.folder'", "trashed=false"]
    if parent_id:
        query_parts.append(f"'{parent_id}' in parents")

    query = " and ".join(query_parts)

    results = service.files().list(
        q=query,
        pageSize=100,
        fields="files(id, name, mimeType, modifiedTime, parents)",
        orderBy="name",
    ).execute()

    return results.get("files", [])
