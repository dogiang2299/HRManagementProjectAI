"""Run notebook 06 logic with project .venv (same as 06_final_core_hybrid_metrics_TWO_MODELS.ipynb)."""
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

K_VALUES = [10, 20]
BASE = Path(__file__).resolve().parent
INPUT_FILE = BASE / "../data_outputs/13_candidate_job_hybrid_ranking.xlsx"
OUTPUT_WITH_LABELS = BASE / "../data_outputs/13_candidate_job_final_ranking_with_labels_simple.xlsx"
OUTPUT_SUMMARY = BASE / "../data_outputs/16_final_metrics_summary_simple.xlsx"
DIRECT_MATCH_THRESHOLD = 0.55
TAXONOMY_GROUP_THRESHOLD = 0.70


def precision_at_k(labels, k):
    return labels[:k].sum() / k


def recall_at_k(labels, total_relevant, k):
    if total_relevant == 0:
        return 0.0
    return labels[:k].sum() / total_relevant


def ndcg_at_k(labels, total_relevant, k):
    top_k = labels[:k]
    if len(top_k) == 0 or total_relevant == 0:
        return 0.0
    discounts = np.log2(np.arange(2, len(top_k) + 2))
    dcg = np.sum(top_k / discounts)
    ideal_len = min(total_relevant, k)
    idcg = np.sum(np.ones(ideal_len) / np.log2(np.arange(2, ideal_len + 2)))
    return dcg / idcg if idcg > 0 else 0.0


def auc_score(labels, scores):
    if len(np.unique(labels)) < 2:
        return np.nan
    return roc_auc_score(labels, scores)


def main():
    df = pd.read_excel(INPUT_FILE)
    df["direct_match"] = df["skill_overlap_score"] >= DIRECT_MATCH_THRESHOLD
    df["taxonomy_match"] = (
        (df["skill_overlap_score"] < DIRECT_MATCH_THRESHOLD)
        & (df["group_similarity_score"] >= TAXONOMY_GROUP_THRESHOLD)
        & (df["dominant_group_score"] == 1)
    )
    df["relevant"] = (df["direct_match"] | df["taxonomy_match"]).astype(int)

    models = [
        {
            "model": "Model 1 - Skill-only Baseline",
            "score_col": "skill_only_score",
            "description": "Only direct skill overlap; no taxonomy; no semantic embedding.",
        },
        {
            "model": "Model 2 - Core Hybrid Recommendation Model",
            "score_col": "offline_final_score",
            "description": "Skill + Taxonomy + Semantic Embedding.",
        },
    ]

    summary_rows = []
    for model_info in models:
        candidate_rows = []
        for candidate_id, group in df.groupby("candidate_id"):
            ranked = group.sort_values(model_info["score_col"], ascending=False)
            labels = ranked["relevant"].to_numpy()
            scores = ranked[model_info["score_col"]].to_numpy()
            tr = int(labels.sum())
            row = {
                "candidate_id": candidate_id,
                "model": model_info["model"],
                "AUC": auc_score(labels, scores),
            }
            for k in K_VALUES:
                row[f"Precision@{k}"] = precision_at_k(labels, k)
                row[f"Recall@{k}"] = recall_at_k(labels, tr, k)
                row[f"NDCG@{k}"] = ndcg_at_k(labels, tr, k)
            candidate_rows.append(row)
        cm = pd.DataFrame(candidate_rows)
        summary = {
            "model": model_info["model"],
            "score_column": model_info["score_col"],
            "description": model_info["description"],
            "num_candidates": df["candidate_id"].nunique(),
            "num_pairs": len(df),
            "num_relevant_pairs": int(df["relevant"].sum()),
        }
        for col in [
            "AUC",
            "Precision@10",
            "Recall@10",
            "NDCG@10",
            "Precision@20",
            "Recall@20",
            "NDCG@20",
        ]:
            summary[col] = cm[col].mean(skipna=True)
        summary_rows.append(summary)

    summary_df = pd.DataFrame(summary_rows)
    df.to_excel(OUTPUT_WITH_LABELS, index=False)
    summary_df.to_excel(OUTPUT_SUMMARY, index=False)

    print("Relevant pairs:", int(df["relevant"].sum()))
    print("\nSummary:")
    print(summary_df.to_string(index=False))


if __name__ == "__main__":
    main()
