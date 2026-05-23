from collections import Counter
from typing import Any, Dict, List, Set, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

# Load taxonomy metadata for a list of skills from SkillTaxonomyMapping.
def get_skill_taxonomy_map(
    skill_ids: Set[str],
    db: Session,
) -> Dict[str, Dict[str, Any]]:
    """
    Load taxonomy group/subgroup for a list of skill IDs.

    Return shape:
    {
        skill_id: {
            "taxonomy_group": "...",
            "taxonomy_subgroup": "..."
        }
    }
    """
    if not skill_ids:
        return {}

    rows = db.execute(
        text("""
            SELECT
                skill_id::text AS skill_id,
                taxonomy_group,
                taxonomy_subgroup
            FROM "SkillTaxonomyMapping"
            WHERE skill_id = ANY(CAST(:skill_ids AS uuid[]))
        """),
        {
            "skill_ids": "{" + ",".join(skill_ids) + "}",
        },
    ).mappings().all()

    result = {}

    for row in rows:
        result[str(row["skill_id"])] = {
            "taxonomy_group": row["taxonomy_group"],
            "taxonomy_subgroup": row["taxonomy_subgroup"],
        }

    return result


def get_taxonomy_groups(
    skill_ids: Set[str],
    skill_taxonomy_map: Dict[str, Dict[str, Any]],
) -> Set[str]:
    groups = set()

    for skill_id in skill_ids:
        taxonomy = skill_taxonomy_map.get(str(skill_id))

        if taxonomy and taxonomy.get("taxonomy_group"):
            groups.add(str(taxonomy["taxonomy_group"]))

    return groups


def get_taxonomy_subgroups(
    skill_ids: Set[str],
    skill_taxonomy_map: Dict[str, Dict[str, Any]],
) -> Set[str]:
    subgroups = set()

    for skill_id in skill_ids:
        taxonomy = skill_taxonomy_map.get(str(skill_id))

        if taxonomy and taxonomy.get("taxonomy_subgroup"):
            subgroups.add(str(taxonomy["taxonomy_subgroup"]))

    return subgroups


def get_dominant_taxonomy_group(
    skill_ids: Set[str],
    skill_taxonomy_map: Dict[str, Dict[str, Any]],
) -> Optional[str]:
    counter = Counter()

    for skill_id in skill_ids:
        taxonomy = skill_taxonomy_map.get(str(skill_id))

        if taxonomy and taxonomy.get("taxonomy_group"):
            counter[str(taxonomy["taxonomy_group"])] += 1

    if not counter:
        return None

    return counter.most_common(1)[0][0]


def compute_overlap_ratio(source: Set[str], target: Set[str]) -> float:
    """
    Compute how much of the target set is covered by the source set.
    The target set is the denominator because the question is how much of
    the job's group/subgroup taxonomy the candidate covers.
    """
    if not target:
        return 0.0

    return len(source.intersection(target)) / len(target)


def compute_taxonomy_scores(
    candidate_skill_ids: Set[str],
    job_skill_ids: Set[str],
    db: Session,
) -> Dict[str, Any]:
    """
    Compute taxonomy scores between a candidate and a job.

    - group_similarity_score:
      how much the candidate covers the job's taxonomy group/subgroup.

    - dominant_group_score:
      whether the candidate's dominant taxonomy group matches the job's dominant group.
    """
    all_skill_ids = set(candidate_skill_ids).union(set(job_skill_ids))

    skill_taxonomy_map = get_skill_taxonomy_map(all_skill_ids, db)

    candidate_groups = get_taxonomy_groups(candidate_skill_ids, skill_taxonomy_map)
    job_groups = get_taxonomy_groups(job_skill_ids, skill_taxonomy_map)

    candidate_subgroups = get_taxonomy_subgroups(candidate_skill_ids, skill_taxonomy_map)
    job_subgroups = get_taxonomy_subgroups(job_skill_ids, skill_taxonomy_map)

    group_overlap_score = compute_overlap_ratio(candidate_groups, job_groups)
    subgroup_overlap_score = compute_overlap_ratio(candidate_subgroups, job_subgroups)

    # Group is weighted slightly higher than subgroup because it is more stable.
    group_similarity_score = (
        0.70 * group_overlap_score
        + 0.30 * subgroup_overlap_score
    )

    candidate_dominant_group = get_dominant_taxonomy_group(
        candidate_skill_ids,
        skill_taxonomy_map,
    )

    job_dominant_group = get_dominant_taxonomy_group(
        job_skill_ids,
        skill_taxonomy_map,
    )

    dominant_group_score = (
        1.0
        if candidate_dominant_group
        and job_dominant_group
        and candidate_dominant_group == job_dominant_group
        else 0.0
    )

    return {
        "group_similarity_score": max(0.0, min(1.0, group_similarity_score)),
        "dominant_group_score": dominant_group_score,
        "candidate_taxonomy_groups": sorted(candidate_groups),
        "job_taxonomy_groups": sorted(job_groups),
        "candidate_taxonomy_subgroups": sorted(candidate_subgroups),
        "job_taxonomy_subgroups": sorted(job_subgroups),
        "candidate_dominant_group": candidate_dominant_group,
        "job_dominant_group": job_dominant_group,
    }
