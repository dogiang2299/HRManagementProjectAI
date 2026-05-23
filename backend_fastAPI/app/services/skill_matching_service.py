import re
from typing import Dict, List, Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.text_cleaning_service import normalize_text, normalize_keyword


def load_skill_dictionary(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(
        text("""
            SELECT
                s.id AS skill_id,
                s.name AS skill_name,
                a.alias_text AS alias_text
            FROM "Skill" s
            LEFT JOIN "SkillAlias" a
                ON a.skill_id = s.id
            WHERE s.is_active = true
        """)
    ).mappings().all()

    dictionary = []

    for row in rows:
        skill_id = str(row["skill_id"])
        skill_name = row["skill_name"]
        alias_text = row["alias_text"]

        keywords = set()

        if skill_name:
            keywords.add(normalize_keyword(skill_name))

        if alias_text:
            keywords.add(normalize_keyword(alias_text))

        for keyword in keywords:
            if not keyword:
                continue

            # Avoid false positives such as "a", "r", or "c" matching random CV text.
            if len(keyword) <= 1:
                continue

            dictionary.append({
                "skill_id": skill_id,
                "skill_name": skill_name,
                "keyword": keyword,
            })
    dictionary.sort(key=lambda item: len(item["keyword"]), reverse=True)
    return dictionary


def keyword_exists_in_text(keyword: str, normalized_cv_text: str) -> bool:
    if not keyword:
        return False

    escaped = re.escape(keyword)

    pattern = r"(?<![a-zA-Z0-9+#.])" + escaped + r"(?![a-zA-Z0-9+#.])"

    return re.search(pattern, normalized_cv_text, flags=re.IGNORECASE) is not None


def extract_skills_from_text(cv_text: str, db: Session) -> List[Dict[str, Any]]:
    normalized_cv_text = normalize_text(cv_text)
    dictionary = load_skill_dictionary(db)

    matched_by_skill: Dict[str, Dict[str, Any]] = {}

    for item in dictionary:
        keyword = item["keyword"]

        if keyword_exists_in_text(keyword, normalized_cv_text):
            skill_id = item["skill_id"]

            if skill_id not in matched_by_skill:
                matched_by_skill[skill_id] = {
                    "skill_id": skill_id,
                    "skill_name": item["skill_name"],
                    "matched_keywords": [],
                }

            matched_by_skill[skill_id]["matched_keywords"].append(keyword)

    results = list(matched_by_skill.values())

    results.sort(key=lambda x: x["skill_name"] or "")

    return results
