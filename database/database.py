"""
SQLite Persistence Layer for Court Case Prioritization System.
Provides persistent storage for pending cases and judge rosters.
"""

import os
import sqlite3
from typing import List, Dict, Any, Optional
import pandas as pd

DB_DIR = "database"
DB_PATH = os.path.join(DB_DIR, "court_cases.db")


def get_db_connection() -> sqlite3.Connection:
    """Establish connection to SQLite database with row factory."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Create schema tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Cases Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS court_cases (
        case_id TEXT PRIMARY KEY,
        petitioner TEXT,
        respondent TEXT,
        case_type TEXT NOT NULL,
        case_year INTEGER NOT NULL,
        filing_date TEXT,
        num_hearings INTEGER DEFAULT 1,
        bench_size INTEGER DEFAULT 2,
        priority_level TEXT DEFAULT 'Medium',
        assigned_judge TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Judges Roster Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS judge_roster (
        judge_id TEXT PRIMARY KEY,
        judge_name TEXT NOT NULL,
        daily_capacity INTEGER DEFAULT 4,
        is_active INTEGER DEFAULT 1
    )
    """)

    conn.commit()

    # Populate default judge roster if empty
    cursor.execute("SELECT COUNT(*) FROM judge_roster")
    if cursor.fetchone()[0] == 0:
        default_judges = [(f"Judge_{i:02d}", f"Hon'ble Justice {i:02d}", 4, 1) for i in range(1, 13)]
        cursor.executemany(
            "INSERT INTO judge_roster (judge_id, judge_name, daily_capacity, is_active) VALUES (?, ?, ?, ?)",
            default_judges,
        )
        conn.commit()

    conn.close()


def insert_case(case_data: Dict[str, Any]) -> bool:
    """Insert or replace a court case record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT OR REPLACE INTO court_cases 
        (case_id, petitioner, respondent, case_type, case_year, filing_date, num_hearings, bench_size, priority_level, assigned_judge)
        VALUES (:case_id, :petitioner, :respondent, :case_type, :case_year, :filing_date, :num_hearings, :bench_size, :priority_level, :assigned_judge)
        """, case_data)
        conn.commit()
        return True
    except Exception as e:
        print(f"Error inserting case: {e}")
        return False
    finally:
        conn.close()


def fetch_all_cases() -> pd.DataFrame:
    """Fetch all stored cases as a DataFrame."""
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM court_cases", conn)
    conn.close()
    return df


def fetch_judge_roster() -> pd.DataFrame:
    """Fetch active judge roster."""
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM judge_roster WHERE is_active = 1", conn)
    conn.close()
    return df


if __name__ == "__main__":
    init_database()
    print("Database initialized successfully at", DB_PATH)
    roster = fetch_judge_roster()
    print("Judge Roster Count:", len(roster))
