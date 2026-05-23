from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ranking_service import rank_candidates_for_job, rank_jobs_for_candidate

router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.post("/candidates/{candidate_id}")
def rank_candidate_jobs(candidate_id: str, db: Session = Depends(get_db)):
    try:
        result = rank_jobs_for_candidate(candidate_id, db)
        return {
            "status": "SUCCESS",
            **result,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jobs/{recruitment_infor_id}")
def rank_job_candidates(
    recruitment_infor_id: str,
    candidate_limit: Optional[int] = Query(default=None, ge=1),
    db: Session = Depends(get_db),
):
    try:
        result = rank_candidates_for_job(
            recruitment_infor_id,
            db,
            candidate_limit=candidate_limit,
        )
        return {
            "status": "SUCCESS",
            **result,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
