from fastapi import APIRouter

from app.config import APP_NAME, PIPELINE_VERSION
from app.database import ping_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check():
    db_ok = ping_db()

    return {
        "service": APP_NAME,
        "status": "OK",
        "database": "OK" if db_ok else "FAILED",
        "pipeline_version": PIPELINE_VERSION,
    }