from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/candidates/{candidate_id}")
def debug_candidate(candidate_id: str, db: Session = Depends(get_db)):
    row = db.execute(
        text("""
            SELECT
                id,
                candidate_name,
                email,
                phone_number,
                cv_file,
                desired_position_id,
                desired_rank_id,
                preferred_job_type
            FROM "Candidate"
            WHERE id = :candidate_id
        """),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return dict(row)


@router.get("/jobs/{job_id}")
def debug_job(job_id: str, db: Session = Depends(get_db)):
    row = db.execute(
        text("""
            SELECT
                r.id,
                r.post_title,
                r.internal_title,
                r.position_post_id,
                r.rank_id,
                r.type_of_job,
                r.experience_min,
                r.experience_max,
                r.experience_label,
                r.status,
                r.is_active,
                p.name_post,
                p.description_post,
                p.requirements_post,
                p.benefits_post
            FROM "Recruitment_Infor" r
            LEFT JOIN "Setting_Position_Posts" p
                ON p.id = r.position_post_id
            WHERE r.id = :job_id
        """),
        {"job_id": job_id},
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    return dict(row)