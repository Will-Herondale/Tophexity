import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class SkillLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CareerRelationType(str, enum.Enum):
    RELATED = "related"
    ALTERNATIVE = "alternative"
    PREREQUISITE = "prerequisite"
    SUPPLEMENTARY = "supplementary"


class RecommendationStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class RoadmapStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class BackupPlanStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ChatMessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
