from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.ai import router as ai_router
from app.api.v1.comparison import router as comparison_router
from app.api.v1.checklist import router as checklist_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(analysis_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(comparison_router)
api_v1_router.include_router(checklist_router)
api_v1_router.include_router(admin_router)
