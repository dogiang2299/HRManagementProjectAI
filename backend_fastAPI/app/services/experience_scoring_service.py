from datetime import date
from typing import Any, Dict, Optional

from app.services.experience_extraction_service import (
    describe_extracted_experience,
    extract_total_experience_months_from_text,
)
from sqlalchemy import text
from sqlalchemy.orm import Session


def months_between(start_date: date, end_date: date) -> int:
    if not start_date or not end_date:
        return 0

    months = (end_date.year - start_date.year) * 12 + (
        end_date.month - start_date.month
    )

    return max(months, 0)


def get_candidate_total_experience_months(candidate_id: str, db: Session) -> int:
    """Return candidate total experience months.

    Priority:
    1. Structured rows from Candidate_Experience, when available.
    2. Rule-based extraction from CV text stored in CandidateAIProfile/Candidate.

    The second source is important for the current product flow because candidates
    mainly update/upload CV files and may not manually maintain Candidate_Experience.
    """
    rows = db.execute(
        text("""
            SELECT
                from_month,
                to_month
            FROM "Candidate_Experience"
            WHERE candidate_id = :candidate_id
              AND is_active = true
              AND from_month IS NOT NULL
        """),
        {"candidate_id": candidate_id},
    ).mappings().all()

    today = date.today()
    total_months = 0

    for row in rows:
        from_month = row["from_month"]
        to_month = row["to_month"] or today

        total_months += months_between(from_month, to_month)

    if total_months > 0:
        return total_months

    # Fallback: extract experience directly from CV/profile text.
    profile = db.execute(
        text("""
            SELECT
                ai.raw_text AS ai_raw_text,
                ai.normalized_text AS ai_normalized_text,
                c.cv_extracted_text AS cv_extracted_text,
                c.career_summary AS career_summary
            FROM "Candidate" c
            LEFT JOIN "CandidateAIProfile" ai
                ON ai.candidate_id = c.id
            WHERE c.id = :candidate_id
            LIMIT 1
        """),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not profile:
        return 0

    text_parts = [
        profile.get("ai_raw_text"),
        profile.get("cv_extracted_text"),
        profile.get("ai_normalized_text"),
        profile.get("career_summary"),
    ]

    cv_text = "\n".join(str(part) for part in text_parts if part)
    return extract_total_experience_months_from_text(cv_text, today=today)


def get_candidate_experience_source(candidate_id: str, db: Session) -> Dict[str, Any]:
    """Return experience months and the source used, for debugging/explanations."""
    structured_months = get_candidate_structured_experience_months(candidate_id, db)
    if structured_months > 0:
        return {
            "months": structured_months,
            "source": "Candidate_Experience",
            "description": f"Structured candidate experience data contains about {structured_months / 12:.1f} years.",
        }

    profile = db.execute(
        text("""
            SELECT
                ai.raw_text AS ai_raw_text,
                ai.normalized_text AS ai_normalized_text,
                c.cv_extracted_text AS cv_extracted_text,
                c.career_summary AS career_summary
            FROM "Candidate" c
            LEFT JOIN "CandidateAIProfile" ai
                ON ai.candidate_id = c.id
            WHERE c.id = :candidate_id
            LIMIT 1
        """),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not profile:
        return {"months": 0, "source": "unknown", "description": "No candidate profile text was found."}

    cv_text = "\n".join(
        str(part)
        for part in [
            profile.get("ai_raw_text"),
            profile.get("cv_extracted_text"),
            profile.get("ai_normalized_text"),
            profile.get("career_summary"),
        ]
        if part
    )
    months = extract_total_experience_months_from_text(cv_text, today=date.today())
    return {
        "months": months,
        "source": "CV_text" if months > 0 else "unknown",
        "description": describe_extracted_experience(months),
    }


def get_candidate_structured_experience_months(candidate_id: str, db: Session) -> int:
    rows = db.execute(
        text("""
            SELECT
                from_month,
                to_month
            FROM "Candidate_Experience"
            WHERE candidate_id = :candidate_id
              AND is_active = true
              AND from_month IS NOT NULL
        """),
        {"candidate_id": candidate_id},
    ).mappings().all()

    today = date.today()
    total_months = 0

    for row in rows:
        from_month = row["from_month"]
        to_month = row["to_month"] or today
        total_months += months_between(from_month, to_month)

    return total_months


def compute_experience_score(
    candidate_experience_years: Optional[float],
    job_experience_min: Optional[float],
    job_experience_max: Optional[float],
) -> Dict[str, Any]:
    """
    Compute the experience match score.

    Score:
    - Job has no explicit experience requirement: 1.0
    - Candidate has no clear experience data: 0.0
    - Candidate is within the min/max range: 1.0
    - Candidate is short by <= 1 year: 0.7
    - Candidate is short by > 1 year: 0.4
    - Candidate exceeds the max range: 0.85
    """
    if job_experience_min is None and job_experience_max is None:
        return {
            "experience_score": 1.0,
            "candidate_experience_years": candidate_experience_years,
            "description": "The job posting does not specify a clear experience requirement.",
        }

    if candidate_experience_years is None:
        return {
            "experience_score": 0.0,
            "candidate_experience_years": None,
            "description": "The candidate profile does not contain clear experience data.",
        }

    min_years = float(job_experience_min or 0)
    max_years = float(job_experience_max) if job_experience_max is not None else None

    if candidate_experience_years >= min_years and (
        max_years is None or candidate_experience_years <= max_years
    ):
        return {
            "experience_score": 1.0,
            "candidate_experience_years": candidate_experience_years,
            "description": f"The candidate has about {candidate_experience_years:.1f} years of experience, matching the job requirement.",
        }

    if candidate_experience_years < min_years:
        gap = min_years - candidate_experience_years

        if gap <= 1:
            score = 0.7
            description = f"The candidate has about {candidate_experience_years:.1f} years of experience, slightly below the minimum requirement of {min_years:.1f} years."
        else:
            score = 0.4
            description = f"The candidate has about {candidate_experience_years:.1f} years of experience, below the minimum requirement of {min_years:.1f} years."

        return {
            "experience_score": score,
            "candidate_experience_years": candidate_experience_years,
            "description": description,
        }

    return {
        "experience_score": 0.85,
        "candidate_experience_years": candidate_experience_years,
        "description": f"The candidate has about {candidate_experience_years:.1f} years of experience, above the requested range but still potentially suitable.",
    }
