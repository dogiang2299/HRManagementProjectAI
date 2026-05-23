from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.job_sync_service import sync_job_profile
from app.services.ranking_service import rank_candidates_for_job

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/{recruitment_infor_id}/sync")
def sync_job(recruitment_infor_id: str, db: Session = Depends(get_db)):
    try:
        result = sync_job_profile(recruitment_infor_id, db, commit=True)
        return {
            "status": "SUCCESS",
            **result,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{recruitment_infor_id}/sync-and-recommend")
def sync_job_and_recommend(
    recruitment_infor_id: str,
    candidate_limit: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db),
):
    try:
        sync_result = sync_job_profile(recruitment_infor_id, db, commit=False)
        ranking_result = rank_candidates_for_job(
            recruitment_infor_id,
            db,
            candidate_limit=candidate_limit,
        )
        return {
            "status": "SUCCESS",
            "sync": sync_result,
            "recommendation": ranking_result,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
