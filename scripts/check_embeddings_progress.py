import asyncio
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
os.chdir(PROJECT_ROOT)
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import func, select

from app.core.database import async_session_factory
from app.models.embedding import DocumentEmbedding


async def main() -> None:
    async with async_session_factory() as db:
        total = (await db.execute(select(func.count(DocumentEmbedding.id)))).scalar() or 0
        by_source = (
            await db.execute(
                select(DocumentEmbedding.source_type, func.count(DocumentEmbedding.id))
                .group_by(DocumentEmbedding.source_type)
            )
        ).all()

    print(f"TOTAL {total}")
    for source_type, count in by_source:
        print(f"{source_type} {count}")


if __name__ == "__main__":
    asyncio.run(main())
