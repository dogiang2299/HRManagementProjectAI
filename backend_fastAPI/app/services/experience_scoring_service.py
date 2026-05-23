from datetime import date
from typing import Any, Dict, Optional

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
