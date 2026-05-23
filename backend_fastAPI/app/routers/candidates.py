from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.candidate_profile_sync_service import sync_candidate_profile
from app.services.cv_text_service import extract_cv_text
from app.services.ranking_service import rank_jobs_for_candidate
from app.services.skill_matching_service import extract_skills_from_text

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.post("/{candidate_id}/parse-cv")
def parse_candidate_cv(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.execute(
        text(
            """
            SELECT id, candidate_name, cv_file, cv_extracted_text
            FROM "Candidate"
            WHERE id = :candidate_id
            """
        ),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    try:
        cv_text = candidate["cv_extracted_text"] or extract_cv_text(candidate["cv_file"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "candidate_id": candidate["id"],
        "candidate_name": candidate["candidate_name"],
        "cv_file": candidate["cv_file"],
        "text_length": len(cv_text),
        "preview": cv_text[:1000],
    }


@router.post("/{candidate_id}/extract-skills")
def extract_candidate_skills(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.execute(
        text(
            """
            SELECT id, candidate_name, cv_file, cv_extracted_text
            FROM "Candidate"
            WHERE id = :candidate_id
            """
        ),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    try:
        cv_text = candidate["cv_extracted_text"] or extract_cv_text(candidate["cv_file"])
        matched_skills = extract_skills_from_text(cv_text, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "candidate_id": candidate["id"],
        "candidate_name": candidate["candidate_name"],
        "cv_file": candidate["cv_file"],
        "text_length": len(cv_text),
        "n_matched_skills": len(matched_skills),
        "matched_skills": matched_skills,
    }


@router.post("/{candidate_id}/sync")
def sync_candidate(candidate_id: str, db: Session = Depends(get_db)):
    try:
        result = sync_candidate_profile(candidate_id, db, commit=True)
        return {
            "status": "SUCCESS",
            **result,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{candidate_id}/sync-and-recommend")
def sync_candidate_and_recommend(candidate_id: str, db: Session = Depends(get_db)):
    try:
        sync_result = sync_candidate_profile(candidate_id, db, commit=False)
        ranking_result = rank_jobs_for_candidate(candidate_id, db)
        return {
            "status": "SUCCESS",
            "sync": sync_result,
            "recommendation": ranking_result,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
