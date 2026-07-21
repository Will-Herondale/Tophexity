from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def auth_health():
    return {"status": "auth router active"}


@router.post("/register")
async def register():
    pass


@router.post("/login")
async def login():
    pass


@router.post("/refresh")
async def refresh_token():
    pass
