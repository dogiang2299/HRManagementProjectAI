# Auto Sync Recommendation Pipeline

This version moves FastAPI from a ranking-only service to the new data processing pipeline.

## Main Endpoints

### Candidate

```http
POST /candidates/{candidate_id}/sync
```

- Read CV text from `Candidate.cv_extracted_text`, `candidate_cv.raw_text`, or the PDF file.
- Normalize text.
- Detect skills using `Skill` + `SkillAlias`.
- Detect positions using `Setting_Position_Posts` + `PositionAlias`.
- Upsert `CandidateSkill`.
- Upsert `CandidateAIProfile`.
- Generate embeddings using `intfloat/multilingual-e5-base`.
- Upsert `CandidateEmbedding`.

```http
POST /candidates/{candidate_id}/sync-and-recommend
```

Run the full candidate sync, then run `rank_jobs_for_candidate` and save the result to `CandidateJobRecommendation`.

### Job

```http
POST /jobs/{recruitment_infor_id}/sync
```

- Combine text from recruitment + position template + rank + work location.
- Normalize text.
- Detect skills using `Skill` + `SkillAlias`.
- Merge additional skills from `PositionSkill` by `position_post_id`.
- Detect positions using `Setting_Position_Posts` + `PositionAlias`.
- Rebuild `RecruitmentSkill`.
- Upsert `JobAIProfile`.
- Generate embeddings using `intfloat/multilingual-e5-base`.
- Upsert `JobEmbedding`.

```http
POST /jobs/{recruitment_infor_id}/sync-and-recommend?candidate_limit=200
```

Run the full job sync, then rank candidates for this job and save the result to `CandidateJobRecommendation`.

## NestJS Integration

After creating/updating a job:

```ts
await this.httpService.axiosRef.post(
  `${this.recommendationApiUrl}/jobs/${recruitmentInforId}/sync-and-recommend`,
);
```

After a candidate uploads/updates a CV:

```ts
await this.httpService.axiosRef.post(
  `${this.recommendationApiUrl}/candidates/${candidateId}/sync-and-recommend`,
);
```

## Notes

- The first run of `intfloat/multilingual-e5-base` will be slower because the model must be downloaded/loaded.
- If the demo machine has no internet access, run it once beforehand to cache the model or load it from a local path.
- `SkillTaxonomyMapping` remains the baseline data normalized earlier by the notebook/recommendation flow; FastAPI uses it during ranking.
- FastAPI does not automatically know when the database has new data. For true automation, NestJS must call the sync endpoint after creating/updating a job or candidate.
