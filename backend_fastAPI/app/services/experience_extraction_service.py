"""Rule-based experience extraction from CV text.

This service is intentionally lightweight for backend runtime:
- It does not require an LLM or external API.
- It handles common English/Vietnamese CV patterns.
- It returns an estimated total number of experience months.

The result is used as a fallback when Candidate_Experience has no structured data.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from typing import Iterable, Optional


MONTH_ALIASES = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
    # Vietnamese month forms after accent removal/normalization are usually "thang"
    "thang 1": 1, "thang 01": 1,
    "thang 2": 2, "thang 02": 2,
    "thang 3": 3, "thang 03": 3,
    "thang 4": 4, "thang 04": 4,
    "thang 5": 5, "thang 05": 5,
    "thang 6": 6, "thang 06": 6,
    "thang 7": 7, "thang 07": 7,
    "thang 8": 8, "thang 08": 8,
    "thang 9": 9, "thang 09": 9,
    "thang 10": 10,
    "thang 11": 11,
    "thang 12": 12,
}

PRESENT_WORDS = {
    "present", "now", "current", "currently", "today",
    "hien tai", "nay", "den nay", "toi nay", "bay gio",
}

EXPERIENCE_HEADINGS = [
    "experience", "work experience", "professional experience", "employment history",
    "career history", "working experience", "project experience",
    "kinh nghiem", "kinh nghiem lam viec", "qua trinh lam viec",
]

STOP_HEADINGS = [
    "education", "hoc van", "skills", "ky nang", "projects", "du an",
    "certifications", "chung chi", "awards", "giai thuong",
    "languages", "ngon ngu", "summary", "objective", "muc tieu",
]


@dataclass(frozen=True)
class MonthPoint:
    year: int
    month: int


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _month_point_to_index(point: MonthPoint) -> int:
    return point.year * 12 + point.month


def _months_between(start: MonthPoint, end: MonthPoint) -> int:
    return max(_month_point_to_index(end) - _month_point_to_index(start), 0)


def _parse_date_token(token: str, today: Optional[date] = None) -> Optional[MonthPoint]:
    today = today or date.today()
    token = _clean_text(token)
    token = token.replace("/", " ").replace(".", " ").replace("-", " ")

    if token in PRESENT_WORDS or any(word in token for word in PRESENT_WORDS):
        return MonthPoint(today.year, today.month)

    # MM YYYY or MM/YYYY
    m = re.search(r"\b(0?[1-9]|1[0-2])\s+(20\d{2}|19\d{2})\b", token)
    if m:
        return MonthPoint(int(m.group(2)), int(m.group(1)))

    # Month name YYYY: Jan 2021, January 2021, thang 01 2021
    for alias, month in MONTH_ALIASES.items():
        pattern = rf"\b{re.escape(alias)}\s+(20\d{{2}}|19\d{{2}})\b"
        m = re.search(pattern, token)
        if m:
            return MonthPoint(int(m.group(1)), month)

    # YYYY only. Use January as conservative start/end month.
    m = re.search(r"\b(20\d{2}|19\d{2})\b", token)
    if m:
        return MonthPoint(int(m.group(1)), 1)

    return None


def _extract_experience_section(text: str) -> str:
    """Return a likely Experience section; fallback to full text when not found.

    We only treat heading-like lines as section headers. This avoids a common
    false cut in sentences like "3 years of experience", where the word
    "experience" is not a heading.
    """
    raw = text or ""
    lines = raw.splitlines()

    start_line: Optional[int] = None
    for i, line in enumerate(lines):
        cleaned = re.sub(r"[^a-zA-Z0-9 +/.-]", " ", line).strip().lower()
        cleaned = re.sub(r"\s+", " ", cleaned)
        if any(cleaned == heading or cleaned.startswith(heading + ":") for heading in EXPERIENCE_HEADINGS):
            start_line = i
            break

    if start_line is None:
        return raw

    end_line = len(lines)
    for j in range(start_line + 1, len(lines)):
        cleaned = re.sub(r"[^a-zA-Z0-9 +/.-]", " ", lines[j]).strip().lower()
        cleaned = re.sub(r"\s+", " ", cleaned)
        if any(cleaned == heading or cleaned.startswith(heading + ":") for heading in STOP_HEADINGS):
            end_line = j
            break

    section = "\n".join(lines[start_line:end_line]).strip()
    return section or raw


def _extract_duration_mentions(text: str) -> list[int]:
    """Extract explicit duration mentions like '3 years', '2+ years', '18 months'."""
    cleaned = _clean_text(text)
    months: list[int] = []

    # English: 3 years, 3+ years, 2.5 years of experience
    for m in re.finditer(r"\b(\d+(?:\.\d+)?)\s*\+?\s*(years?|yrs?)\b", cleaned):
        years = float(m.group(1))
        months.append(int(round(years * 12)))

    # Vietnamese without accents after normalization: 3 nam, 2.5 nam kinh nghiem
    for m in re.finditer(r"\b(\d+(?:\.\d+)?)\s*\+?\s*(nam)\b", cleaned):
        years = float(m.group(1))
        months.append(int(round(years * 12)))

    # English/Vietnamese months: 18 months, 18 thang
    for m in re.finditer(r"\b(\d+)\s*(months?|mos?|thang)\b", cleaned):
        months.append(int(m.group(1)))

    return months


def _extract_date_ranges(text: str, today: Optional[date] = None) -> list[tuple[MonthPoint, MonthPoint]]:
    today = today or date.today()
    cleaned = _clean_text(text)

    # Candidate date token patterns. Kept intentionally broad for CV formats.
    date_token = r"(?:" \
        r"(?:0?[1-9]|1[0-2])[\/\.\-\s]+(?:20\d{2}|19\d{2})" \
        r"|(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(?:20\d{2}|19\d{2})" \
        r"|(?:thang\s+)?(?:0?[1-9]|1[0-2])\s+(?:20\d{2}|19\d{2})" \
        r"|(?:20\d{2}|19\d{2})" \
        r"|present|now|current|currently|today|hien tai|den nay|toi nay|nay" \
        r")"

    connector = r"\s*(?:-|–|—|to|until|den|toi|đến|tới)\s*"
    pattern = re.compile(rf"({date_token}){connector}({date_token})", re.IGNORECASE)

    ranges: list[tuple[MonthPoint, MonthPoint]] = []
    for match in pattern.finditer(cleaned):
        start = _parse_date_token(match.group(1), today=today)
        end = _parse_date_token(match.group(2), today=today)
        if start and end and _month_point_to_index(end) >= _month_point_to_index(start):
            ranges.append((start, end))

    return ranges


def _merge_ranges(ranges: Iterable[tuple[MonthPoint, MonthPoint]]) -> list[tuple[int, int]]:
    intervals = sorted(
        (_month_point_to_index(start), _month_point_to_index(end))
        for start, end in ranges
        if _month_point_to_index(end) > _month_point_to_index(start)
    )

    if not intervals:
        return []

    merged: list[tuple[int, int]] = []
    cur_start, cur_end = intervals[0]

    for start, end in intervals[1:]:
        if start <= cur_end:
            cur_end = max(cur_end, end)
        else:
            merged.append((cur_start, cur_end))
            cur_start, cur_end = start, end

    merged.append((cur_start, cur_end))
    return merged


def extract_total_experience_months_from_text(text: str, today: Optional[date] = None) -> int:
    """Estimate total work experience months from CV text.

    Priority:
    1. Parse date ranges inside the experience section.
    2. Fallback to explicit mentions such as '3 years of experience'.
    3. Return 0 when no reliable signal is found.
    """
    if not text or not text.strip():
        return 0

    section = _extract_experience_section(text)
    ranges = _extract_date_ranges(section, today=today)
    merged_ranges = _merge_ranges(ranges)

    if merged_ranges:
        total = sum(end - start for start, end in merged_ranges)
        return max(int(total), 0)

    duration_mentions = _extract_duration_mentions(section)
    if duration_mentions:
        # Use the maximum explicit experience mention to avoid double-counting repeated summaries.
        return max(duration_mentions)

    return 0


def describe_extracted_experience(months: int) -> str:
    if months <= 0:
        return "No clear work experience duration was extracted from the CV text."

    years = months / 12
    return f"Estimated about {years:.1f} years of experience from the CV text."
