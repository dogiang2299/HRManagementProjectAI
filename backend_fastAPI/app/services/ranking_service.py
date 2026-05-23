import math
import re
import unicodedata
from typing import Any, Dict, List, Optional, Set
from app.services.taxonomy_scoring_service import compute_taxonomy_scores
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.services.experience_scoring_service import (
    compute_experience_score,
    get_candidate_total_experience_months,
)
PIPELINE_VERSION = "hr_rec_v1"
MODEL_NAME = "intfloat/multilingual-e5-base"


def parse_vector(value: Any) -> List[float]:
    """
    Postgres jsonb vector_json is usually returned by psycopg2 as a list.
    If it is returned as a string, parse it defensively.
    """
    if value is None:
        return []

    if isinstance(value, list):
        return [float(x) for x in value]

    if isinstance(value, str):
        import json
        parsed = json.loads(value)
        return [float(x) for x in parsed]

    return []


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def get_candidate_context(candidate_id: str, db: Session) -> Dict[str, Any]:
    candidate = db.execute(
        text("""
            SELECT
                c.id,
                c.candidate_name,
                c.address,
                c.country,
                c.provice,
                c.district,
                c.desired_position_id,
                c.desired_rank_id,
                c.preferred_job_type,
                p.detected_position_ids,
                p.detected_skill_ids,
                p.inferred_rank_id,
                e.vector_json
            FROM "Candidate" c
            LEFT JOIN "CandidateAIProfile" p
                ON p.candidate_id = c.id
            LEFT JOIN "CandidateEmbedding" e
                ON e.candidate_id = c.id
            WHERE c.id = :candidate_id
        """),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not candidate:
        raise ValueError("Candidate not found")

    skill_rows = db.execute(
        text("""
            SELECT skill_id
            FROM "CandidateSkill"
            WHERE candidate_id = :candidate_id
        """),
        {"candidate_id": candidate_id},
    ).mappings().all()

    candidate_skill_ids = {str(row["skill_id"]) for row in skill_rows}

    detected_position_ids = candidate["detected_position_ids"] or []
    detected_position_ids = [str(x) for x in detected_position_ids]

    return {
        "id": str(candidate["id"]),
        "candidate_name": candidate["candidate_name"],
        "address": candidate["address"],
        "country": candidate["country"],
        "province": candidate["provice"],
        "district": candidate["district"],
        "desired_position_id": str(candidate["desired_position_id"]) if candidate["desired_position_id"] else None,
        "desired_rank_id": str(candidate["desired_rank_id"]) if candidate["desired_rank_id"] else None,
        "preferred_job_type": candidate["preferred_job_type"],
        "detected_position_ids": detected_position_ids,
        "inferred_rank_id": str(candidate["inferred_rank_id"]) if candidate["inferred_rank_id"] else None,
        "skill_ids": candidate_skill_ids,
        "embedding": parse_vector(candidate["vector_json"]),
    }

def get_active_jobs(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(
        text("""
            SELECT
                r.id AS recruitment_infor_id,
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
                r.work_location_id,
                wl.short_address AS work_location_short_address,
                wl.address AS work_location_address,
                p.detected_position_ids,
                p.detected_skill_ids,
                e.vector_json
            FROM "Recruitment_Infor" r
            LEFT JOIN "InforCompany" wl
                ON wl.id = r.work_location_id
            LEFT JOIN "JobAIProfile" p
                ON p.recruitment_infor_id = r.id
            LEFT JOIN "JobEmbedding" e
                ON e.recruitment_infor_id = r.id
            WHERE r.is_active = true
              AND r.status = 'PUBLIC'
        """)
    ).mappings().all()

    jobs = []

    for row in rows:
        job_id = str(row["recruitment_infor_id"])

        skill_rows = db.execute(
            text("""
                SELECT skill_id, is_required
                FROM "RecruitmentSkill"
                WHERE recruitment_id = :job_id
            """),
            {"job_id": job_id},
        ).mappings().all()

        required_skill_ids = {
            str(skill["skill_id"])
            for skill in skill_rows
            if skill["is_required"] is True
        }

        all_skill_ids = {
            str(skill["skill_id"])
            for skill in skill_rows
        }

        detected_position_ids = row["detected_position_ids"] or []
        detected_position_ids = [str(x) for x in detected_position_ids]

        jobs.append({
            "recruitment_infor_id": job_id,
            "post_title": row["post_title"],
            "internal_title": row["internal_title"],
            "position_post_id": str(row["position_post_id"]) if row["position_post_id"] else None,
            "rank_id": str(row["rank_id"]) if row["rank_id"] else None,
            "type_of_job": row["type_of_job"],
            "experience_min": row["experience_min"],
            "experience_max": row["experience_max"],
            "experience_label": row["experience_label"],
            "work_location_id": str(row["work_location_id"]) if row["work_location_id"] else None,
            "work_location_short_address": row["work_location_short_address"],
            "work_location_address": row["work_location_address"],
            "detected_position_ids": detected_position_ids,
            "required_skill_ids": required_skill_ids,
            "all_skill_ids": all_skill_ids,
            "embedding": parse_vector(row["vector_json"]),
        })

    return jobs

def compute_skill_overlap_score(
    candidate_skill_ids: Set[str],
    job_required_skill_ids: Set[str],
    job_all_skill_ids: Set[str],
) -> Dict[str, Any]:
    """
    Prefer required skills.
    If the job has no required skills, use all RecruitmentSkill records.
    """
    target_skill_ids = job_required_skill_ids if job_required_skill_ids else job_all_skill_ids

    if not target_skill_ids:
        return {
            "score": 0.0,
            "matched_skill_ids": [],
            "missing_skill_ids": [],
        }

    matched = candidate_skill_ids.intersection(target_skill_ids)
    missing = target_skill_ids.difference(candidate_skill_ids)

    return {
        "score": len(matched) / len(target_skill_ids),
        "matched_skill_ids": list(matched),
        "missing_skill_ids": list(missing),
    }


def compute_position_score(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    candidate_positions = set()

    for pos_id in candidate["detected_position_ids"]:
        candidate_positions.add(pos_id)

    job_positions = set()

    if job["position_post_id"]:
        job_positions.add(job["position_post_id"])

    for pos_id in job["detected_position_ids"]:
        job_positions.add(pos_id)

    if not candidate_positions or not job_positions:
        return 0.0

    if candidate_positions.intersection(job_positions):
        return 1.0

    return 0.0


def compute_rank_score(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    """Deprecated: rank_score is no longer used in the final formula."""
    return 0.0


def normalize_job_type(value: Optional[str]) -> str:
    if not value:
        return ""

    value = value.lower().strip()
    value = value.replace("_", " ").replace("-", " ")
    value = re.sub(r"\s+", " ", value).strip()

    aliases = {
        "fulltime": "full-time",
        "full time": "full-time",
        "full-time": "full-time",
        "parttime": "part-time",
        "part time": "part-time",
        "part-time": "part-time",
        "contract": "contract",
        "intern": "internship",
        "internship": "internship",
        "hybrid": "hybrid",
        "remote": "remote",
        "work from home": "remote",
        "wfh": "remote",
        "onsite": "on-site",
        "on site": "on-site",
        "on-site": "on-site",
        "office": "on-site",
    }

    return aliases.get(value, value)


def compute_job_type_score(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    candidate_type = normalize_job_type(candidate.get("preferred_job_type"))
    job_type = normalize_job_type(job.get("type_of_job"))

    if not candidate_type or not job_type:
        return 0.0

    if candidate_type == job_type:
        return 1.0

    flexible_work_types = {"remote", "hybrid", "on-site"}
    contract_types = {"full-time", "part-time", "contract", "internship"}

    # If the candidate selects Hybrid/Remote but the job is Full-time, Part-time,
    # this cannot be considered a complete mismatch because the field mixes meanings.
    if candidate_type in flexible_work_types and job_type in contract_types:
        return 0.4

    if candidate_type in contract_types and job_type in flexible_work_types:
        return 0.4

    # Hybrid and Remote are relatively close.
    if candidate_type == "hybrid" and job_type == "remote":
        return 0.75

    if candidate_type == "remote" and job_type == "hybrid":
        return 0.6

    # Hybrid can still include partial on-site work.
    if candidate_type == "hybrid" and job_type == "on-site":
        return 0.5

    # Remote versus on-site is a strong mismatch.
    if candidate_type == "remote" and job_type == "on-site":
        return 0.0

    # Full-time versus Contract/Part-time is not the same work expectation.
    if candidate_type == "full-time" and job_type == "contract":
        return 0.3

    if candidate_type == "full-time" and job_type == "part-time":
        return 0.2

    if candidate_type == "internship" and job_type != "internship":
        return 0.2

    return 0.0

def normalize_location_text(value: Optional[str]) -> str:
    if not value:
        return ""

    value = value.lower().strip()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))

    replacements = {
        "tp.": " ",
        "tp ": " ",
        "thanh pho": " ",
        "city": " ",
        "province": " ",
        "district": " ",
        "quan": " ",
        "huyen": " ",
        ".": " ",
        ",": " ",
        "-": " ",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    value = re.sub(r"[^a-z0-9 ]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()

    value = value.replace("ho chi minh", "hcm")
    value = value.replace("tp hcm", "hcm")
    value = value.replace("tphcm", "hcm")
    value = value.replace("sai gon", "hcm")
    value = value.replace("saigon", "hcm")
    value = value.replace("ha noi", "hanoi")
    value = value.replace("da nang", "danang")
    value = value.replace("can tho", "cantho")
    value = value.replace("hai phong", "haiphong")

    value = re.sub(r"\s+", " ", value).strip()

    aliases = {
        "hcm": "hcm",
        "hanoi": "hanoi",
        "danang": "danang",
        "cantho": "cantho",
        "haiphong": "haiphong",
        "hn": "hanoi",
        "dn": "danang",
    }

    return aliases.get(value, value)


def compute_location_score(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    job_type = normalize_job_type(job.get("type_of_job"))

    # Remote jobs should not be penalized strongly by location.
    if job_type == "remote":
        return 1.0

    candidate_location = " ".join(
        str(x)
        for x in [
            candidate.get("province"),
            candidate.get("district"),
            candidate.get("address"),
        ]
        if x
    )

    job_location = " ".join(
        str(x)
        for x in [
            job.get("work_location_short_address"),
            job.get("work_location_address"),
        ]
        if x
    )

    candidate_norm = normalize_location_text(candidate_location)
    job_norm = normalize_location_text(job_location)

    if not candidate_norm or not job_norm:
        return 0.0

    if candidate_norm == job_norm:
        return 1.0

    candidate_tokens = set(candidate_norm.split())
    job_tokens = set(job_norm.split())

    city_tokens = {"hcm", "hanoi", "danang", "cantho", "haiphong"}

    if candidate_tokens.intersection(job_tokens).intersection(city_tokens):
        return 1.0

    if candidate_tokens.intersection(job_tokens):
        return 0.7

    return 0.0


def build_reason_texts(
    skill_score: float,
    position_score: float,
    semantic_score: float,
    matched_skill_ids: List[str],
    missing_skill_ids: List[str],
) -> List[str]:
    reasons = []

    if matched_skill_ids:
        reasons.append(
            f"The candidate has {len(matched_skill_ids)} skills that match the job requirements."
        )

    if missing_skill_ids:
        reasons.append(
            f"The candidate is missing {len(missing_skill_ids)} skills required for the job."
        )

    if position_score > 0:
        reasons.append(
            "The desired position or the position detected from the CV matches the job posting."
        )

    if semantic_score >= 0.7:
        reasons.append(
            "The CV content has high semantic similarity with the job description."
        )
    elif semantic_score >= 0.4:
        reasons.append(
            "The CV content has moderate semantic similarity with the job description."
        )

    if not reasons:
        reasons.append(
            "This job is recommended based on a combination of skills, position, and semantic embedding."
        )

    return reasons


def upsert_candidate_job_recommendation(
    db: Session,
    candidate_id: str,
    job_id: str,
    skill_overlap_score: float,
    group_similarity_score: float,
    dominant_group_score: float,
    baseline_score: float,
    semantic_score: float,
    hybrid_score: float,
    experience_score: float,
    job_type_score: float,
    location_score: float,
    position_score: float,
    rank_score: float,
    final_score: float,
    matched_skill_ids: List[str],
    missing_skill_ids: List[str],
    reason_texts: List[str],
):
    db.execute(
        text("""
            INSERT INTO "CandidateJobRecommendation" (
                candidate_id,
                recruitment_infor_id,
                skill_overlap_score,
                group_similarity_score,
                dominant_group_score,
                baseline_score,
                semantic_score,
                hybrid_score,
                experience_score,
                job_type_score,
                location_score,
                position_score,
                rank_score,
                final_score,
                matched_skill_ids,
                missing_skill_ids,
                reason_texts,
                pipeline_version,
                model_name,
                calculated_at,
                created_at,
                updated_at
            )
            VALUES (
                :candidate_id,
                :recruitment_infor_id,
                :skill_overlap_score,
                :group_similarity_score,
                :dominant_group_score,
                :baseline_score,
                :semantic_score,
                :hybrid_score,
                :experience_score,
                :job_type_score,
                :location_score,
                :position_score,
                :rank_score,
                :final_score,
                CAST(:matched_skill_ids AS uuid[]),
                CAST(:missing_skill_ids AS uuid[]),
                CAST(:reason_texts AS text[]),
                :pipeline_version,
                :model_name,
                NOW(),
                NOW(),
                NOW()
            )
            ON CONFLICT (candidate_id, recruitment_infor_id)
            DO UPDATE SET
                skill_overlap_score = EXCLUDED.skill_overlap_score,
                group_similarity_score = EXCLUDED.group_similarity_score,
                dominant_group_score = EXCLUDED.dominant_group_score,
                baseline_score = EXCLUDED.baseline_score,
                semantic_score = EXCLUDED.semantic_score,
                hybrid_score = EXCLUDED.hybrid_score,
                experience_score = EXCLUDED.experience_score,
                job_type_score = EXCLUDED.job_type_score,
                location_score = EXCLUDED.location_score,
                position_score = EXCLUDED.position_score,
                rank_score = EXCLUDED.rank_score,
                final_score = EXCLUDED.final_score,
                matched_skill_ids = EXCLUDED.matched_skill_ids,
                missing_skill_ids = EXCLUDED.missing_skill_ids,
                reason_texts = EXCLUDED.reason_texts,
                pipeline_version = EXCLUDED.pipeline_version,
                model_name = EXCLUDED.model_name,
                calculated_at = NOW(),
                updated_at = NOW()
        """),
        {
            "candidate_id": candidate_id,
            "recruitment_infor_id": job_id,
            "skill_overlap_score": skill_overlap_score,
            "group_similarity_score": group_similarity_score,
            "dominant_group_score": dominant_group_score,
            "baseline_score": baseline_score,
            "semantic_score": semantic_score,
            "hybrid_score": hybrid_score,
            "experience_score": experience_score,
            "job_type_score": job_type_score,
            "location_score": location_score,
            "position_score": position_score,
            "rank_score": rank_score,
            "final_score": final_score,
            "matched_skill_ids": matched_skill_ids,
            "missing_skill_ids": missing_skill_ids,
            "reason_texts": reason_texts,
            "pipeline_version": PIPELINE_VERSION,
            "model_name": MODEL_NAME,
        },
    )

def rank_jobs_for_candidate(candidate_id: str, db: Session) -> Dict[str, Any]:
    candidate = get_candidate_context(candidate_id, db)

    candidate_total_experience_months = get_candidate_total_experience_months(
        candidate_id,
        db,
    )

    candidate_experience_years = (
        candidate_total_experience_months / 12
        if candidate_total_experience_months > 0
        else None
    )

    jobs = get_active_jobs(db)
    results = []

    for job in jobs:
        skill_result = compute_skill_overlap_score(
            candidate_skill_ids=candidate["skill_ids"],
            job_required_skill_ids=job["required_skill_ids"],
            job_all_skill_ids=job["all_skill_ids"],
        )

        experience_result = compute_experience_score(
            candidate_experience_years=candidate_experience_years,
            job_experience_min=job.get("experience_min"),
            job_experience_max=job.get("experience_max"),
        )

        experience_score = experience_result["experience_score"]
        skill_overlap_score = clamp01(skill_result["score"])

        position_score = compute_position_score(candidate, job)

        taxonomy_scores = compute_taxonomy_scores(
            candidate_skill_ids=candidate["skill_ids"],
            job_skill_ids=job["all_skill_ids"],
            db=db,
        )

        group_similarity_score = taxonomy_scores["group_similarity_score"]
        dominant_group_score = taxonomy_scores["dominant_group_score"]

        rank_score = 0.0  # Deprecated: rank removed from formula
        job_type_score = compute_job_type_score(candidate, job)
        location_score = compute_location_score(candidate, job)

        if candidate["embedding"] and job["embedding"]:
            raw_cosine = cosine_similarity(candidate["embedding"], job["embedding"])
            semantic_score = clamp01(raw_cosine)
        else:
            semantic_score = 0.0

        baseline_score = ( # điểm khớp lõi theo skill + taxonomy
            0.65 * skill_overlap_score # trùng bao skill
            + 0.25 * group_similarity_score   # taxonomy: khớp nhóm kỹ năng/nghề
            + 0.10 * dominant_group_score   # taxonomy: khớp nhóm chính nổi bật
        )

        hybrid_score = (
            0.70 * baseline_score  # điểm dựa trên cấu trúc
            + 0.30 * semantic_score # semantic embedding
        )

        final_score = clamp01(
            0.70 * hybrid_score # mức độ phù hợp nội dung CV/job, gồm skill + taxonomy + semantic
            + 0.11 * position_score # vị trí công việc
            + 0.08 * experience_score # kinh nghiệm
            + 0.06 * job_type_score # hình thức làm việc
            + 0.05 * location_score # địa điểm
        )

        # Guard 1:
        # If no skills match, cap the score at a "worth considering" level.
        if skill_overlap_score == 0:
            final_score = min(final_score, 0.49)

        # Guard 2:
        # Only apply the location cap when the job is not Remote.
        # Remote jobs do not depend on location.
        job_type = normalize_job_type(job.get("type_of_job"))

        if job_type != "remote":
            if location_score == 0 and job_type_score == 0:
                final_score = min(final_score, 0.78)
            elif location_score == 0 and job_type_score < 0.5:
                final_score = min(final_score, 0.82)

        matched_skill_ids = skill_result["matched_skill_ids"]
        missing_skill_ids = skill_result["missing_skill_ids"]

        reason_texts = build_reason_texts(
            skill_score=skill_overlap_score,
            position_score=position_score,
            semantic_score=semantic_score,
            matched_skill_ids=matched_skill_ids,
            missing_skill_ids=missing_skill_ids,
        )

        upsert_candidate_job_recommendation(
            db=db,
            candidate_id=candidate_id,
            job_id=job["recruitment_infor_id"],
            skill_overlap_score=skill_overlap_score,
            group_similarity_score=group_similarity_score,
            dominant_group_score=dominant_group_score,
            baseline_score=baseline_score,
            semantic_score=semantic_score,
            hybrid_score=hybrid_score,
            experience_score=experience_score,
            job_type_score=job_type_score,
            location_score=location_score,
            position_score=position_score,
            rank_score=rank_score,
            final_score=final_score,
            matched_skill_ids=matched_skill_ids,
            missing_skill_ids=missing_skill_ids,
            reason_texts=reason_texts,
        )

        results.append({
            "recruitment_infor_id": job["recruitment_infor_id"],
            "post_title": job["post_title"],
            "internal_title": job["internal_title"],
            "skill_overlap_score": skill_overlap_score,
            "group_similarity_score": group_similarity_score,
            "dominant_group_score": dominant_group_score,
            "baseline_score": baseline_score,
            "semantic_score": semantic_score,
            "hybrid_score": hybrid_score,
            "experience_score": experience_score,
            "job_type_score": job_type_score,
            "location_score": location_score,
            "position_score": position_score,
            "rank_score": rank_score,
            "final_score": final_score,
            "candidate_experience_years": candidate_experience_years,
            "experience_reason": experience_result["description"],
            "matched_skill_ids": matched_skill_ids,
            "missing_skill_ids": missing_skill_ids,
            "reason_texts": reason_texts,
        })

    results.sort(key=lambda x: x["final_score"], reverse=True)

    db.commit()

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate["candidate_name"],
        "candidate_experience_years": candidate_experience_years,
        "n_ranked_jobs": len(results),
        "items": results[:20],
    }

def get_job_context(job_id: str, db: Session) -> Dict[str, Any]:
    row = db.execute(
        text("""
            SELECT
                r.id AS recruitment_infor_id,
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
                r.work_location_id,
                wl.short_address AS work_location_short_address,
                wl.address AS work_location_address,
                p.detected_position_ids,
                p.detected_skill_ids,
                e.vector_json
            FROM "Recruitment_Infor" r
            LEFT JOIN "InforCompany" wl
                ON wl.id = r.work_location_id
            LEFT JOIN "JobAIProfile" p
                ON p.recruitment_infor_id = r.id
            LEFT JOIN "JobEmbedding" e
                ON e.recruitment_infor_id = r.id
            WHERE r.id = :job_id
        """),
        {"job_id": job_id},
    ).mappings().first()

    if not row:
        raise ValueError("Recruitment job not found")

    skill_rows = db.execute(
        text("""
            SELECT skill_id, is_required
            FROM "RecruitmentSkill"
            WHERE recruitment_id = :job_id
        """),
        {"job_id": job_id},
    ).mappings().all()

    required_skill_ids = {
        str(skill["skill_id"])
        for skill in skill_rows
        if skill["is_required"] is True
    }

    all_skill_ids = {
        str(skill["skill_id"])
        for skill in skill_rows
    }

    detected_position_ids = row["detected_position_ids"] or []
    detected_position_ids = [str(x) for x in detected_position_ids]

    return {
        "recruitment_infor_id": str(row["recruitment_infor_id"]),
        "post_title": row["post_title"],
        "internal_title": row["internal_title"],
        "position_post_id": str(row["position_post_id"]) if row["position_post_id"] else None,
        "rank_id": str(row["rank_id"]) if row["rank_id"] else None,
        "type_of_job": row["type_of_job"],
        "experience_min": row["experience_min"],
        "experience_max": row["experience_max"],
        "experience_label": row["experience_label"],
        "work_location_id": str(row["work_location_id"]) if row["work_location_id"] else None,
        "work_location_short_address": row["work_location_short_address"],
        "work_location_address": row["work_location_address"],
        "detected_position_ids": detected_position_ids,
        "required_skill_ids": required_skill_ids,
        "all_skill_ids": all_skill_ids,
        "embedding": parse_vector(row["vector_json"]),
    }

def get_active_candidate_ids(db: Session, limit: Optional[int] = None) -> List[str]:
    sql = """
        SELECT id
        FROM "Candidate"
        WHERE is_active = true
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    """
    params = {}
    if limit is not None and limit > 0:
        sql += " LIMIT :limit"
        params["limit"] = limit

    rows = db.execute(text(sql), params).mappings().all()
    return [str(row["id"]) for row in rows]


def rank_candidates_for_job(
    recruitment_infor_id: str,
    db: Session,
    candidate_limit: Optional[int] = None,
) -> Dict[str, Any]:
    job = get_job_context(recruitment_infor_id, db)
    candidate_ids = get_active_candidate_ids(db, limit=candidate_limit)

    results = []

    for candidate_id in candidate_ids:
        candidate = get_candidate_context(candidate_id, db)

        candidate_total_experience_months = get_candidate_total_experience_months(
            candidate_id,
            db,
        )

        candidate_experience_years = (
            candidate_total_experience_months / 12
            if candidate_total_experience_months > 0
            else None
        )

        skill_result = compute_skill_overlap_score(
            candidate_skill_ids=candidate["skill_ids"],
            job_required_skill_ids=job["required_skill_ids"],
            job_all_skill_ids=job["all_skill_ids"],
        )

        experience_result = compute_experience_score(
            candidate_experience_years=candidate_experience_years,
            job_experience_min=job.get("experience_min"),
            job_experience_max=job.get("experience_max"),
        )

        experience_score = experience_result["experience_score"]
        skill_overlap_score = clamp01(skill_result["score"])
        position_score = compute_position_score(candidate, job)

        taxonomy_scores = compute_taxonomy_scores(
            candidate_skill_ids=candidate["skill_ids"],
            job_skill_ids=job["all_skill_ids"],
            db=db,
        )

        group_similarity_score = taxonomy_scores["group_similarity_score"]
        dominant_group_score = taxonomy_scores["dominant_group_score"]

        rank_score = 0.0  # Deprecated: rank removed from formula
        job_type_score = compute_job_type_score(candidate, job)
        location_score = compute_location_score(candidate, job)

        if candidate["embedding"] and job["embedding"]:
            raw_cosine = cosine_similarity(candidate["embedding"], job["embedding"])
            semantic_score = clamp01(raw_cosine)
        else:
            semantic_score = 0.0

        baseline_score = (
            0.65 * skill_overlap_score
            + 0.25 * group_similarity_score
            + 0.10 * dominant_group_score
        )

        hybrid_score = (
            0.70 * baseline_score
            + 0.30 * semantic_score
        )

        final_score = clamp01(
            0.70 * hybrid_score # mức độ phù hợp nội dung CV/job, gồm skill + taxonomy + semantic
            + 0.11 * position_score # vị trí công việc
            + 0.08 * experience_score # kinh nghiệm
            + 0.06 * job_type_score # hình thức làm việc
            + 0.05 * location_score # địa điểm
        )

        # Guard 1:
        # If no skills match, cap the score at a "worth considering" level.
        if skill_overlap_score == 0:
            final_score = min(final_score, 0.49)

        # Guard 2:
        # Only apply the location cap when the job is not Remote.
        # Remote jobs do not depend on location.
        job_type = normalize_job_type(job.get("type_of_job"))

        if job_type != "remote":
            if location_score == 0 and job_type_score == 0:
                final_score = min(final_score, 0.78)
            elif location_score == 0 and job_type_score < 0.5:
                final_score = min(final_score, 0.82)

        matched_skill_ids = skill_result["matched_skill_ids"]
        missing_skill_ids = skill_result["missing_skill_ids"]

        reason_texts = build_reason_texts(
            skill_score=skill_overlap_score,
            position_score=position_score,
            semantic_score=semantic_score,
            matched_skill_ids=matched_skill_ids,
            missing_skill_ids=missing_skill_ids,
        )

        upsert_candidate_job_recommendation(
            db=db,
            candidate_id=candidate_id,
            job_id=recruitment_infor_id,
            skill_overlap_score=skill_overlap_score,
            group_similarity_score=group_similarity_score,
            dominant_group_score=dominant_group_score,
            baseline_score=baseline_score,
            semantic_score=semantic_score,
            hybrid_score=hybrid_score,
            experience_score=experience_score,
            job_type_score=job_type_score,
            location_score=location_score,
            position_score=position_score,
            rank_score=rank_score,
            final_score=final_score,
            matched_skill_ids=matched_skill_ids,
            missing_skill_ids=missing_skill_ids,
            reason_texts=reason_texts,
        )

        results.append({
            "candidate_id": candidate_id,
            "candidate_name": candidate["candidate_name"],
            "skill_overlap_score": skill_overlap_score,
            "group_similarity_score": group_similarity_score,
            "dominant_group_score": dominant_group_score,
            "baseline_score": baseline_score,
            "semantic_score": semantic_score,
            "hybrid_score": hybrid_score,
            "experience_score": experience_score,
            "job_type_score": job_type_score,
            "location_score": location_score,
            "position_score": position_score,
            "rank_score": rank_score,
            "final_score": final_score,
            "candidate_experience_years": candidate_experience_years,
            "experience_reason": experience_result["description"],
            "matched_skill_ids": matched_skill_ids,
            "missing_skill_ids": missing_skill_ids,
            "reason_texts": reason_texts,
        })

    results.sort(key=lambda x: x["final_score"], reverse=True)
    db.commit()

    return {
        "recruitment_infor_id": recruitment_infor_id,
        "post_title": job["post_title"],
        "n_ranked_candidates": len(results),
        "items": results[:20],
    }
