from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def roadmaps_health():
    return {"status": "roadmaps router active"}


@router.post("/generate")
async def generate_roadmap():
    pass


@router.get("/history")
async def get_roadmap_history():
    pass


@router.get("/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    pass
