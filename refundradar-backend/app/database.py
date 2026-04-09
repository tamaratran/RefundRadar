import aiosqlite
import os

DATABASE_PATH = os.getenv("DATABASE_PATH", "/data/app.db")

# Fallback to local path for development
if not os.path.exists(os.path.dirname(DATABASE_PATH)):
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), "..", "app.db")


async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            balance REAL,
            category TEXT DEFAULT 'uncategorized',
            merchant TEXT,
            account_name TEXT,
            source_file TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS refund_opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            potential_savings REAL NOT NULL,
            status TEXT DEFAULT 'detected',
            confidence TEXT DEFAULT 'medium',
            details TEXT,
            claim_template TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (transaction_id) REFERENCES transactions(id)
        );

        CREATE TABLE IF NOT EXISTS drive_sync (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id TEXT UNIQUE,
            file_name TEXT,
            synced_at TEXT DEFAULT (datetime('now')),
            transaction_count INTEGER DEFAULT 0
        );
    """)
    await db.commit()
    await db.close()
