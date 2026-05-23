import os
import json
import argparse
from pathlib import Path
from typing import List, Tuple, Optional

import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer


MODEL_NAME = "intfloat/multilingual-e5-base"
BATCH_SIZE = 32

CANDIDATE_PREFIX = "query: "
JOB_PREFIX = "passage: "


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    return " ".join(text.strip().split())


def chunk_list(items: List[Tuple], size: int) -> List[List[Tuple]]:
    return [items[i:i + size] for i in range(0, len(items), size)]


def clean_database_url(database_url: str) -> str:
    if "?schema=" in database_url:
        database_url = database_url.split("?schema=")[0]
    return database_url


def get_connection():
    base_dir = Path(__file__).resolve().parents[3]
    env_path = base_dir / "backend" / ".env"

    load_dotenv(dotenv_path=env_path)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError(f"DATABASE_URL not found in environment. Checked: {env_path}")

    database_url = clean_database_url(database_url)
    return psycopg2.connect(database_url)


def fetch_candidate_profiles(conn, candidate_id: Optional[str] = None) -> List[Tuple[str, str]]:
    with conn.cursor() as cur:
        if candidate_id:
            cur.execute("""
                SELECT cap.candidate_id, cap.normalized_text
                FROM "CandidateAIProfile" cap
                WHERE cap.candidate_id = %s
                  AND cap.normalized_text IS NOT NULL
                  AND TRIM(cap.normalized_text) <> ''
            """, (candidate_id,))
        else:
            cur.execute("""
                SELECT cap.candidate_id, cap.normalized_text
                FROM "CandidateAIProfile" cap
                LEFT JOIN "CandidateEmbedding" ce
                  ON ce.candidate_id = cap.candidate_id
                WHERE cap.normalized_text IS NOT NULL
                  AND TRIM(cap.normalized_text) <> ''
                  AND (
                    ce.candidate_id IS NULL
                    OR ce.updated_at IS NULL
                    OR cap.updated_at IS NULL
                    OR cap.updated_at > ce.updated_at
                  )
                ORDER BY cap.updated_at ASC NULLS LAST, cap.created_at ASC
            """)
        return [(row[0], normalize_text(row[1])) for row in cur.fetchall()]


def fetch_job_profiles(conn, recruitment_infor_id: Optional[str] = None) -> List[Tuple[str, str]]:
    with conn.cursor() as cur:
        if recruitment_infor_id:
            cur.execute("""
                SELECT jap.recruitment_infor_id, jap.normalized_text
                FROM "JobAIProfile" jap
                WHERE jap.recruitment_infor_id = %s
                  AND jap.normalized_text IS NOT NULL
                  AND TRIM(jap.normalized_text) <> ''
            """, (recruitment_infor_id,))
        else:
            cur.execute("""
                SELECT jap.recruitment_infor_id, jap.normalized_text
                FROM "JobAIProfile" jap
                LEFT JOIN "JobEmbedding" je
                  ON je.recruitment_infor_id = jap.recruitment_infor_id
                WHERE jap.normalized_text IS NOT NULL
                  AND TRIM(jap.normalized_text) <> ''
                  AND (
                    je.recruitment_infor_id IS NULL
                    OR je.updated_at IS NULL
                    OR jap.updated_at IS NULL
                    OR jap.updated_at > je.updated_at
                  )
                ORDER BY jap.updated_at ASC NULLS LAST, jap.created_at ASC
            """)
        return [(row[0], normalize_text(row[1])) for row in cur.fetchall()]


def upsert_candidate_embeddings(conn, rows: List[Tuple[str, List[float]]]):
    with conn.cursor() as cur:
        execute_batch(
            cur,
            """
            INSERT INTO "CandidateEmbedding" (
                id,
                candidate_id,
                model_name,
                vector_json,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                %s,
                %s,
                %s::jsonb,
                NOW(),
                NOW()
            )
            ON CONFLICT (candidate_id)
            DO UPDATE SET
                model_name = EXCLUDED.model_name,
                vector_json = EXCLUDED.vector_json,
                updated_at = NOW()
            """,
            [
                (candidate_id, MODEL_NAME, json.dumps(vector))
                for candidate_id, vector in rows
            ],
            page_size=100,
        )
    conn.commit()


def upsert_job_embeddings(conn, rows: List[Tuple[str, List[float]]]):
    with conn.cursor() as cur:
        execute_batch(
            cur,
            """
            INSERT INTO "JobEmbedding" (
                id,
                recruitment_infor_id,
                model_name,
                vector_json,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                %s,
                %s,
                %s::jsonb,
                NOW(),
                NOW()
            )
            ON CONFLICT (recruitment_infor_id)
            DO UPDATE SET
                model_name = EXCLUDED.model_name,
                vector_json = EXCLUDED.vector_json,
                updated_at = NOW()
            """,
            [
                (recruitment_infor_id, MODEL_NAME, json.dumps(vector))
                for recruitment_infor_id, vector in rows
            ],
            page_size=100,
        )
    conn.commit()


def encode_texts(model: SentenceTransformer, texts: List[str]) -> List[List[float]]:
    vectors = model.encode(
        texts,
        batch_size=BATCH_SIZE,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    return [vec.tolist() for vec in vectors]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate-id", type=str, default=None)
    parser.add_argument("--job-id", type=str, default=None)
    args = parser.parse_args()

    print("Loading model:", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)

    conn = get_connection()
    try:
        candidate_profiles = fetch_candidate_profiles(conn, args.candidate_id)
        job_profiles = fetch_job_profiles(conn, args.job_id)

        print("Found %d candidate profiles needing embeddings" % len(candidate_profiles))
        print("Found %d job profiles needing embeddings" % len(job_profiles))

        candidate_chunks = chunk_list(candidate_profiles, BATCH_SIZE)
        total_candidate = 0

        for chunk in candidate_chunks:
            ids = [item[0] for item in chunk]
            texts = [CANDIDATE_PREFIX + item[1] for item in chunk]
            vectors = encode_texts(model, texts)
            upsert_candidate_embeddings(conn, list(zip(ids, vectors)))
            total_candidate += len(chunk)
            print("Candidate embeddings upserted: %d/%d" % (total_candidate, len(candidate_profiles)))

        job_chunks = chunk_list(job_profiles, BATCH_SIZE)
        total_job = 0

        for chunk in job_chunks:
            ids = [item[0] for item in chunk]
            texts = [JOB_PREFIX + item[1] for item in chunk]
            vectors = encode_texts(model, texts)
            upsert_job_embeddings(conn, list(zip(ids, vectors)))
            total_job += len(chunk)
            print("Job embeddings upserted: %d/%d" % (total_job, len(job_profiles)))

        print("Done generating embeddings.")

    finally:
        conn.close()


if __name__ == "__main__":
    main()