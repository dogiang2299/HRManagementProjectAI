import math
from typing import Any, Dict, List, Optional, Set

from sqlalchemy import text
from sqlalchemy.orm import Session

PIPELINE_VERSION = "hr_rec_v1"
MODEL_NAME = "intfloat/multilingual-e5-base"


# đọc vector embedding từ database.
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

# tính độ giống nhau giữa embedding của candidate và embedding của job.
def cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


# ép về khoảng 0 -> 1
def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))

# Hàm này lấy toàn bộ dữ liệu cần thiết của candidate để ranking.
def get_candidate_context(candidate_id: str, db: Session) -> Dict[str, Any]:
    candidate = db.execute(
        text("""
            SELECT
                c.id,
                c.candidate_name,
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
        "desired_position_id": str(candidate["desired_position_id"]) if candidate["desired_position_id"] else None,
        "desired_rank_id": str(candidate["desired_rank_id"]) if candidate["desired_rank_id"] else None,
        "preferred_job_type": candidate["preferred_job_type"],
        "detected_position_ids": detected_position_ids,
        "inferred_rank_id": str(candidate["inferred_rank_id"]) if candidate["inferred_rank_id"] else None,
        "skill_ids": candidate_skill_ids,
        "embedding": parse_vector(candidate["vector_json"]),
    }

# lấy job hoạt động
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
                r.status,
                r.is_active,
                p.detected_position_ids,
                p.detected_skill_ids,
                e.vector_json
            FROM "Recruitment_Infor" r
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
                WHERE recruitment_infor_id = :job_id
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
            "detected_position_ids": detected_position_ids,
            "required_skill_ids": required_skill_ids,
            "all_skill_ids": all_skill_ids,
            "embedding": parse_vector(row["vector_json"]),
        })

    return jobs

# tính độ khớp skill của candi với job - ưu tiên required còn không có required thì dùng toàn bộ skill job

# đây là hàm trả ra khớp bao nhiêu skill
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
        "score": len(matched) / len(target_skill_ids), # khớp 2 / 4 skill chẳng hạn = 0.5
        "matched_skill_ids": list(matched),
        "missing_skill_ids": list(missing),
    }

# tính độ khớp của nghề nghiệp
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

# k dùng hàm này nữa
def compute_rank_score(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    """Deprecated: rank_score is no longer used in the final formula."""
    return 0.0

# tính độ khớp của loại công việc
def compute_job_type_score(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    candidate_type = candidate["preferred_job_type"]
    job_type = job["type_of_job"]

    if not candidate_type or not job_type:
        return 0.0

    return 1.0 if candidate_type.lower().strip() == job_type.lower().strip() else 0.0

# tạo lý do giải thích vì sao job được recommend.
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
            f"The candidate is missing {len(missing_skill_ids)} skills compared to the job requirements."
        )

    if position_score > 0:
        reasons.append(
            "The candidate's desired position or the position detected from the CV matches the job posting."
        )

    if semantic_score >= 0.7:
        reasons.append(
            "The CV content has a high semantic similarity with the job description."
        )
    elif semantic_score >= 0.4:
        reasons.append(
            "The CV content has a moderate semantic similarity with the job description."
        )

    if not reasons:
        reasons.append(
            "The job is recommended based on an overall combination of skills, position, and semantic embedding."
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
                :final_score,
                :matched_skill_ids,
                :missing_skill_ids,
                :reason_texts,
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
    jobs = get_active_jobs(db)

    if not candidate["embedding"]:
        raise ValueError("Candidate embedding not found")

    results = []

    for job in jobs:
        if not job["embedding"]:
            continue

        skill_result = compute_skill_overlap_score(
            candidate_skill_ids=candidate["skill_ids"],
            job_required_skill_ids=job["required_skill_ids"],
            job_all_skill_ids=job["all_skill_ids"],
        )

        skill_overlap_score = clamp01(skill_result["score"])

        position_score = compute_position_score(candidate, job)
        group_similarity_score = position_score
        dominant_group_score = position_score

        job_type_score = compute_job_type_score(candidate, job)

        raw_cosine = cosine_similarity(candidate["embedding"], job["embedding"])
        semantic_score = clamp01(raw_cosine)

        baseline_score = (
            0.60 * skill_overlap_score
            + 0.25 * group_similarity_score
            + 0.15 * dominant_group_score
        )

        # Hybrid follows the agreed offline scoring flow.
        hybrid_score = (
            0.70 * baseline_score
            + 0.30 * semantic_score
        )

        # MVP: final_score is based on hybrid + job_type.
        final_score = clamp01(
            0.93 * hybrid_score
            + 0.07 * job_type_score
        )

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
            "final_score": final_score,
            "matched_skill_ids": matched_skill_ids,
            "missing_skill_ids": missing_skill_ids,
            "reason_texts": reason_texts,
        })

    results.sort(key=lambda x: x["final_score"], reverse=True)

    db.commit()

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate["candidate_name"],
        "n_ranked_jobs": len(results),
        "items": results[:20],
    }
