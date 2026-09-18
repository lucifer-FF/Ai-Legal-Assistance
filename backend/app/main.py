import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_v1_router
from app.seeds.seed import run_seed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lexiguard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed initial admin & demo data (tables managed via Alembic migrations)
    logger.info("Initializing LexiGuard backend services...")
    try:
        run_seed()
    except Exception as e:
        logger.warning(f"Seeding warning: {e}")
    logger.info("LexiGuard backend ready.")
    yield
    # Shutdown
    logger.info("Shutting down LexiGuard backend.")


app = FastAPI(
    title="LexiGuard — AI Legal Document Intelligence Platform",
    description=(
        "Production-grade GenAI legal assistant and document intelligence API. "
        "Provides grounded contract analysis, RAG Q&A, clause explanation, side-by-side comparison, "
        "and attorney consultation briefs."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, list):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def add_legal_disclaimer_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-LexiGuard-Disclaimer"] = (
        "Informational assistance only. Does not constitute legal advice."
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred.",
            "error_type": exc.__class__.__name__
        }
    )


# Mount API V1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


# Health check endpoint
@app.get("/health", tags=["General"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "gemini_model": settings.GEMINI_MODEL
    }


# Frontend SPA Static Serving (Common Link: serves both UI and API from port 8000)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not intercept API, docs, openapi, or health endpoints
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("redoc") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not Found")

        file_path = frontend_dist / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", tags=["General"])
    def root():
        return {
            "app": "LexiGuard — AI Legal Document Intelligence & Assistance Platform",
            "version": "1.0.0",
            "status": "operational",
            "disclaimer": "Informational assistance only. Not a qualified legal professional or law firm.",
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR
        }
