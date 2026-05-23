import re
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.text_cleaning_service import normalize_keyword, normalize_text


def load_position_dictionary(db: Session) -> List[Dict[str, Any]]:
    rows = db.execute(
        text(
            """
            SELECT
                p.id AS position_id,
                p.name_post AS position_name,
                a.alias_text AS alias_text
            FROM "Setting_Position_Posts" p
            LEFT JOIN "PositionAlias" a
                ON a.position_id = p.id
            """
        )
    ).mappings().all()

    dictionary: List[Dict[str, Any]] = []

    for row in rows:
        position_id = str(row["position_id"])
        position_name = row["position_name"]
        alias_text = row["alias_text"]

        keywords = set()
        if position_name:
            keywords.add(normalize_keyword(position_name))
        if alias_text:
            keywords.add(normalize_keyword(alias_text))

        for keyword in keywords:
            if keyword and len(keyword) > 1:
                dictionary.append(
                    {
                        "position_id": position_id,
                        "position_name": position_name,
                        "keyword": keyword,
                    }
                )

    dictionary.sort(key=lambda item: len(item["keyword"]), reverse=True)
    return dictionary


def keyword_exists_in_text(keyword: str, normalized_text: str) -> bool:
    if not keyword:
        return False
    escaped = re.escape(keyword)
    pattern = r"(?<![a-zA-Z0-9+#.])" + escaped + r"(?![a-zA-Z0-9+#.])"
    return re.search(pattern, normalized_text, flags=re.IGNORECASE) is not None


def extract_positions_from_text(raw_text: str, db: Session) -> List[Dict[str, Any]]:
    normalized = normalize_text(raw_text)
    dictionary = load_position_dictionary(db)

    matched: Dict[str, Dict[str, Any]] = {}

    for item in dictionary:
        if keyword_exists_in_text(item["keyword"], normalized):
            position_id = item["position_id"]
            if position_id not in matched:
                matched[position_id] = {
                    "position_id": position_id,
                    "position_name": item["position_name"],
                    "matched_keywords": [],
                }
            matched[position_id]["matched_keywords"].append(item["keyword"])

    return list(matched.values())
