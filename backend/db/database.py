"""SQLite database initialization and connection management."""

import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "feedback.db")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS feedback_sessions (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    domain TEXT NOT NULL,
    experiment_type TEXT DEFAULT '',
    key_terms TEXT DEFAULT '[]',
    overall_rating REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section_reviews (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES feedback_sessions(id),
    section TEXT NOT NULL,
    rating INTEGER DEFAULT 3,
    corrections TEXT DEFAULT '[]',
    annotations TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_domain ON feedback_sessions(domain);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_session ON section_reviews(session_id);
"""


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    db = await get_db()
    try:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
        print(f"[DB] Initialized at {DB_PATH}")
    finally:
        await db.close()
