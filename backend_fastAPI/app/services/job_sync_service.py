import json
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.embedding_service import MODEL_NAME, encode_text
from app.services.position_matching_service import extract_positions_from_text
from app.services.skill_matching_service import extract_skills_from_text
from app.services.text_cleaning_service import normalize_text


def to_pg_uuid_array(values: List[str]) -> str:
    if not values:
        return "{}"

    unique_values = []
    seen = set()
    for value in values:
        value = str(value)
        if value and value not in seen:
            unique_values.append(value)
            seen.add(value)

    return "{" + ",".join(unique_values) + "}"


def build_job_text(job: Dict[str, Any]) -> str:
    parts = [
        job.get("post_title"),
        job.get("internal_title"),
        job.get("name_post"),
        job.get("description_post"),
        job.get("requirements_post"),
        job.get("benefits_post"),
        job.get("type_of_job"),
        job.get("experience_label"),
        job.get("rank_name"),
        job.get("work_location_name"),
    ]
    return "\n".join(str(part) for part in parts if part)


def load_position_template_skill_ids(position_post_id: str, db: Session) -> List[str]:
    if not position_post_id:
        return []

    rows = db.execute(
        text(
            """
            SELECT skill_id
            FROM "PositionSkill"
            WHERE position_id = :position_post_id
            """
        ),
        {"position_post_id": position_post_id},
    ).mappings().all()

    return [str(row["skill_id"]) for row in rows]


def sync_job_profile(recruitment_infor_id: str, db: Session, commit: bool = True) -> Dict[str, Any]:
    job = db.execute(
        text(
            """
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
                p.name_post,
                p.description_post,
                p.requirements_post,
                p.benefits_post,
                rk.name_rank AS rank_name,
                COALESCE(wl.short_address, wl.address, wl.full_name) AS work_location_name
            FROM "Recruitment_Infor" r
            LEFT JOIN "Setting_Position_Posts" p
                ON p.id = r.position_post_id
            LEFT JOIN "Rank" rk
                ON rk.id = r.rank_id
            LEFT JOIN "InforCompany" wl
                ON wl.id = r.work_location_id
            WHERE r.id = :recruitment_infor_id
            """
        ),
        {"recruitment_infor_id": recruitment_infor_id},
    ).mappings().first()

    if not job:
        raise ValueError("Recruitment job not found")

    raw_text = build_job_text(dict(job))
    normalized_text = normalize_text(raw_text)

    matched_skills = extract_skills_from_text(raw_text, db)
    matched_positions = extract_positions_from_text(raw_text, db)

    detected_skill_ids = [skill["skill_id"] for skill in matched_skills]
    template_skill_ids = load_position_template_skill_ids(
        str(job["position_post_id"]) if job["position_post_id"] else None,
        db,
    )
    skill_ids = detected_skill_ids + template_skill_ids

    position_ids = [position["position_id"] for position in matched_positions]
    if job["position_post_id"]:
        position_ids.append(str(job["position_post_id"]))

    # Rebuild RecruitmentSkill from detected JD skills + position template skills.
    db.execute(
        text(
            """
            DELETE FROM "RecruitmentSkill"
            WHERE recruitment_id = :recruitment_infor_id
            """
        ),
        {"recruitment_infor_id": recruitment_infor_id},
    )

    for skill_id in dict.fromkeys(skill_ids):
        db.execute(
            text(
                """
                INSERT INTO "RecruitmentSkill" (
                    recruitment_id,
                    skill_id,
                    is_required
                )
                VALUES (
                    :recruitment_infor_id,
                    :skill_id,
                    true
                )
                ON CONFLICT (recruitment_id, skill_id)
                DO UPDATE SET
                    is_required = EXCLUDED.is_required
                """
            ),
            {"recruitment_infor_id": recruitment_infor_id, "skill_id": skill_id},
        )

    db.execute(
        text(
            """
            INSERT INTO "JobAIProfile" (
                recruitment_infor_id,
                raw_text,
                normalized_text,
                detected_position_ids,
                detected_skill_ids,
                rank_id,
                created_at,
                updated_at
            )
            VALUES (
                :recruitment_infor_id,
                :raw_text,
                :normalized_text,
                CAST(:detected_position_ids AS uuid[]),
                CAST(:detected_skill_ids AS uuid[]),
                :rank_id,
                NOW(),
                NOW()
            )
            ON CONFLICT (recruitment_infor_id)
            DO UPDATE SET
                raw_text = EXCLUDED.raw_text,
                normalized_text = EXCLUDED.normalized_text,
                detected_position_ids = EXCLUDED.detected_position_ids,
                detected_skill_ids = EXCLUDED.detected_skill_ids,
                rank_id = EXCLUDED.rank_id,
                updated_at = NOW()
            """
        ),
        {
            "recruitment_infor_id": recruitment_infor_id,
            "raw_text": raw_text,
            "normalized_text": normalized_text,
            "detected_position_ids": to_pg_uuid_array(position_ids),
            "detected_skill_ids": to_pg_uuid_array(skill_ids),
            "rank_id": str(job["rank_id"]) if job["rank_id"] else None,
        },
    )

    vector = encode_text(normalized_text)

    db.execute(
        text(
            """
            INSERT INTO "JobEmbedding" (
                recruitment_infor_id,
                model_name,
                vector_json,
                created_at,
                updated_at
            )
            VALUES (
                :recruitment_infor_id,
                :model_name,
                CAST(:vector_json AS jsonb),
                NOW(),
                NOW()
            )
            ON CONFLICT (recruitment_infor_id)
            DO UPDATE SET
                model_name = EXCLUDED.model_name,
                vector_json = EXCLUDED.vector_json,
                updated_at = NOW()
            """
        ),
        {
            "recruitment_infor_id": recruitment_infor_id,
            "model_name": MODEL_NAME,
            "vector_json": json.dumps(vector),
        },
    )

    if commit:
        db.commit()

    return {
        "recruitment_infor_id": recruitment_infor_id,
        "text_length": len(raw_text),
        "n_detected_skills": len(set(detected_skill_ids)),
        "n_template_skills": len(set(template_skill_ids)),
        "n_total_skills": len(set(skill_ids)),
        "n_detected_positions": len(set(position_ids)),
        "embedding_dimension": len(vector),
        "detected_skills": matched_skills,
        "detected_positions": matched_positions,
    }
