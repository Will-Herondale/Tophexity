from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def portfolio_health():
    return {"status": "portfolio router active"}


@router.get("/")
async def get_portfolio():
    pass


@router.post("/items")
async def add_portfolio_item():
    pass


@router.put("/items/{item_id}")
async def update_portfolio_item(item_id: str):
    pass


@router.delete("/items/{item_id}")
async def delete_portfolio_item(item_id: str):
    pass
