"""Verify Alembic upgrade/downgrade/upgrade on a disposable PostgreSQL database."""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
import uuid
from pathlib import Path

import asyncpg
from sqlalchemy.engine import make_url

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings


async def _create_database(admin_conn: asyncpg.Connection, db_name: str) -> None:
    await admin_conn.execute(f'CREATE DATABASE "{db_name}"')


async def _drop_database(admin_conn: asyncpg.Connection, db_name: str) -> None:
    await admin_conn.execute(
        """
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
        """,
        db_name,
    )
    await admin_conn.execute(f'DROP DATABASE IF EXISTS "{db_name}"')


def _run_alembic(command: list[str], database_url: str) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = database_url
    result = subprocess.run(
        [sys.executable, "-m", "alembic", *command],
        env=env,
        check=False,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"alembic {' '.join(command)} failed\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        )


async def main() -> None:
    settings = get_settings()
    url = make_url(settings.DATABASE_URL)

    if not url.drivername.startswith("postgresql"):
        raise RuntimeError("Migration verification script only supports PostgreSQL")

    db_name = f"career_path_rc1_{uuid.uuid4().hex[:8]}"
    query = dict(url.query)
    ssl_mode = query.get("ssl") or query.get("sslmode")

    admin_kwargs = {
        "host": url.host,
        "port": url.port or 5432,
        "user": url.username,
        "password": url.password,
        "database": "postgres",
    }
    if ssl_mode == "require":
        admin_kwargs["ssl"] = "require"

    admin_conn = await asyncpg.connect(**admin_kwargs)
    temp_url_obj = url.set(database=db_name)
    temp_url = temp_url_obj.render_as_string(hide_password=False)

    try:
        print(f"Creating temp database: {db_name}")
        await _create_database(admin_conn, db_name)

        print("Running: alembic upgrade head")
        _run_alembic(["upgrade", "head"], temp_url)

        print("Running: alembic downgrade base")
        _run_alembic(["downgrade", "base"], temp_url)

        print("Running: alembic upgrade head")
        _run_alembic(["upgrade", "head"], temp_url)

        print("Running: alembic current")
        _run_alembic(["current"], temp_url)

        print("Migration verification succeeded.")
    finally:
        print(f"Dropping temp database: {db_name}")
        await _drop_database(admin_conn, db_name)
        await admin_conn.close()


if __name__ == "__main__":
    asyncio.run(main())
