# Candidate có CV / thông tin cá nhân
# → FastAPI lấy dữ liệu từ PostgreSQL
# → đọc text từ CV
# → chuẩn hóa text
# → tìm skill trong CV
# → tìm vị trí nghề nghiệp trong CV
# → lưu vào các bảng AI
# → tạo vector embedding
# → lưu embedding vào DB : chuẩn bị dữ liệu ứng viên: đọc CV, extract skill, tạo embedding.

import json
from typing import Any, Dict, List # convert vector embedding từ dạng list Python sang JSON trước khi lưu DB.

from sqlalchemy import text
from sqlalchemy.orm import Session # là cổng để kết nối FastAPI đọc/ghi sql 

from app.services.cv_text_service import extract_cv_text
from app.services.embedding_service import MODEL_NAME, encode_text
from app.services.experience_extraction_service import extract_total_experience_months_from_text
from app.services.position_matching_service import extract_positions_from_text
from app.services.skill_matching_service import extract_skills_from_text
from app.services.text_cleaning_service import normalize_text

# Hàm này biến list UUID Python thành dạng PostgreSQL uuid array như "{1111-aaaa,2222-bbbb}"
def to_pg_uuid_array(values: List[str]) -> str:
    if not values:
        return "{}"

    unique_values = []
    seen = set() # loại trùng để tránh 1 skill bị lặp lại nhiều lần
    for value in values:
        value = str(value)
        if value and value not in seen:
            unique_values.append(value)
            seen.add(value)

    return "{" + ",".join(unique_values) + "}"


def build_candidate_fallback_text(candidate: Dict[str, Any]) -> str: # fallback này giúp hệ thống vẫn có dữ liệu tối thiểu để xử lý
    parts = [
        candidate.get("candidate_name"),
        candidate.get("email"),
        candidate.get("phone_number"),
        candidate.get("address"),
        candidate.get("district"),
        candidate.get("provice"),
        candidate.get("country"),
        candidate.get("career_summary"),
    ]
    return "\n".join(str(part) for part in parts if part)

# Đồng bộ hồ sơ AI của ứng viên từ thông tin Candidate/CV sang các bảng 
# 
# AI như CandidateAIProfile, CandidateEmbedding, CandidateSkill.

def sync_candidate_profile(candidate_id: str, db: Session, commit: bool = True) -> Dict[str, Any]:
    candidate = db.execute(
        text(
            """
            SELECT id, candidate_name, email, phone_number, address, country, provice, district, cv_file, cv_extracted_text, career_summary
            FROM "Candidate"
            WHERE id = :candidate_id
            """
        ),
        {"candidate_id": candidate_id},
    ).mappings().first()

    if not candidate:
        raise ValueError("Candidate not found")

    raw_text = ""

    # Prefer reading from the original CV file to avoid stale cv_extracted_text.
    if candidate.get("cv_file"):
        try:
            raw_text = extract_cv_text(candidate["cv_file"])
        except Exception:
            raw_text = ""

    if not raw_text.strip():
        raw_text = candidate.get("cv_extracted_text") or ""

    if not raw_text.strip():
        primary_cv = db.execute(
            text(
                """
                SELECT raw_text, summary, desired_position, file_url
                FROM "candidate_cv"
                WHERE candidate_id = :candidate_id
                ORDER BY is_primary DESC, updated_at DESC
                LIMIT 1
                """
            ),
            {"candidate_id": candidate_id},
        ).mappings().first()

        if primary_cv:
            raw_text = "\n".join(
                str(part)
                for part in [
                    primary_cv.get("raw_text"),
                    primary_cv.get("summary"),
                    primary_cv.get("desired_position"),
                ]
                if part
            )

    if not raw_text.strip() and candidate.get("cv_file"):
        try:
            raw_text = extract_cv_text(candidate["cv_file"])
        except Exception:
            raw_text = ""

    if not raw_text.strip():
        raw_text = build_candidate_fallback_text(dict(candidate))

    normalized_text = normalize_text(raw_text)
    extracted_experience_months = extract_total_experience_months_from_text(raw_text)
    matched_skills = extract_skills_from_text(raw_text, db)
    matched_positions = extract_positions_from_text(raw_text, db)

    skill_ids = [skill["skill_id"] for skill in matched_skills]
    position_ids = [position["position_id"] for position in matched_positions]

    # Rebuild CandidateSkill from the latest CV/profile text.
    db.execute(
        text(
            """
            DELETE FROM "CandidateSkill"
            WHERE candidate_id = :candidate_id
            """
        ),
        {"candidate_id": candidate_id},
    )

    for skill_id in skill_ids:
        db.execute(
            text(
                """
                INSERT INTO "CandidateSkill" (
                    candidate_id,
                    skill_id
                )
                VALUES (
                    :candidate_id,
                    :skill_id
                )
                ON CONFLICT DO NOTHING
                """
            ),
            {"candidate_id": candidate_id, "skill_id": skill_id},
        )

    db.execute(
        text(
            """
            INSERT INTO "CandidateAIProfile" (
                candidate_id,
                raw_text,
                normalized_text,
                detected_position_ids,
                detected_skill_ids,
                created_at,
                updated_at
            )
            VALUES (
                :candidate_id,
                :raw_text,
                :normalized_text,
                CAST(:detected_position_ids AS uuid[]),
                CAST(:detected_skill_ids AS uuid[]),
                NOW(),
                NOW()
            )
            ON CONFLICT (candidate_id)
            DO UPDATE SET
                raw_text = EXCLUDED.raw_text,
                normalized_text = EXCLUDED.normalized_text,
                detected_position_ids = EXCLUDED.detected_position_ids,
                detected_skill_ids = EXCLUDED.detected_skill_ids,
                updated_at = NOW()
            """
        ),
        {
            "candidate_id": candidate_id,
            "raw_text": raw_text,
            "normalized_text": normalized_text,
            "detected_position_ids": to_pg_uuid_array(position_ids),
            "detected_skill_ids": to_pg_uuid_array(skill_ids),
        },
    )

    vector = encode_text(normalized_text)

    db.execute(
        text(
            """
            INSERT INTO "CandidateEmbedding" (
                candidate_id,
                model_name,
                vector_json,
                created_at,
                updated_at
            )
            VALUES (
                :candidate_id,
                :model_name,
                CAST(:vector_json AS jsonb),
                NOW(),
                NOW()
            )
            ON CONFLICT (candidate_id)
            DO UPDATE SET
                model_name = EXCLUDED.model_name,
                vector_json = EXCLUDED.vector_json,
                updated_at = NOW()
            """
        ),
        {
            "candidate_id": candidate_id,
            "model_name": MODEL_NAME,
            "vector_json": json.dumps(vector),
        },
    )

    if commit:
        db.commit()

    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate["candidate_name"],
        "cv_file": candidate["cv_file"],
        "text_length": len(raw_text),
        "n_matched_skills": len(set(skill_ids)),
        "n_matched_positions": len(set(position_ids)),
        "extracted_experience_months": extracted_experience_months,
        "extracted_experience_years": round(extracted_experience_months / 12, 2) if extracted_experience_months > 0 else None,
        "embedding_dimension": len(vector),
        "matched_skills": matched_skills,
        "matched_positions": matched_positions,
    }
