from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def chat_health():
    return {"status": "chat router active"}


@router.post("/")
async def send_message():
    pass


@router.get("/history")
async def get_chat_history():
    pass
