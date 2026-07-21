from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def users_health():
    return {"status": "users router active"}


@router.get("/me")
async def get_current_user():
    pass


@router.put("/me")
async def update_current_user():
    pass


@router.get("/{user_id}")
async def get_user(user_id: str):
    pass
