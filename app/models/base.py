from app.core.database import Base

# Import all models so Base.metadata knows about them.
import app.models  # noqa: F401

__all__ = ["Base"]
