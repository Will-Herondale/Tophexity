"""Resume embedding rebuild without deleting existing rows.

Useful if a long rebuild was interrupted.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def main() -> None:
    from app.core.database import async_session_factory
    from app.services.embedding_service import _rebuild_source_type

    source_types = ["career", "skill", "degree", "college", "scholarship", "exam"]

    for stype in source_types:
        print(f"\n{'=' * 60}")
        print(f"Resuming: {stype}")
        print(f"{'=' * 60}")
        async with async_session_factory() as db:
            count = await _rebuild_source_type(db, stype, delete_existing=False)
            print(f"  Added: {count} embeddings for {stype}")


if __name__ == "__main__":
    asyncio.run(main())
