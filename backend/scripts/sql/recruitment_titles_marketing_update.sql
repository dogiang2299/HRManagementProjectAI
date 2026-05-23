-- Make Recruitment_Infor post_title more marketing-heavy but still embedding-safe
-- Safe for rerun: always reset to the clean base title before appending slogan
-- Rollback:
-- UPDATE "Recruitment_Infor"
-- SET "post_title" = regexp_replace("post_title", '\s*(\||-|\(|\[).*$' , '', 'g'),
--     "updated_at" = NOW();

BEGIN;

WITH ranked AS (
  SELECT
    r.id,
    r.post_title,
    r.type_of_job,
    r.salary_from,
    r.salary_to,
    r.salary_currency,
    regexp_replace(r.post_title, '\s*(\||-|\(|\[).*$' , '', 'g') AS base_title,
    ROW_NUMBER() OVER (ORDER BY r.created_at, r.id) AS rn
  FROM "Recruitment_Infor" r
  WHERE r.is_active = true
)
UPDATE "Recruitment_Infor" t
SET
  "post_title" = CASE (ranked.rn % 20)

    WHEN 0 THEN ranked.base_title || ' (Income Up to ' ||
      CASE
        WHEN ranked.salary_currency = 'USD' AND ranked.salary_to IS NOT NULL
          THEN '$' || TO_CHAR(ranked.salary_to, 'FM9,999,999')
        WHEN ranked.salary_currency IS NOT NULL AND ranked.salary_to IS NOT NULL
          THEN TO_CHAR(ranked.salary_to, 'FM9,999,999') || ' ' || ranked.salary_currency
        ELSE 'Top-Tier Compensation'
      END || ') (Urgent Hiring)'

    WHEN 1 THEN ranked.base_title || ' - Premium Salary (Immediate Start)'
    WHEN 2 THEN ranked.base_title || ' | High-Paying Opportunity | Fast Interview'
    WHEN 3 THEN ranked.base_title || ' (Excellent Compensation) - Product Team'
    WHEN 4 THEN ranked.base_title || ' | Attractive Offer (Apply Now)'
    WHEN 5 THEN ranked.base_title || ' - Competitive Package | Interview This Week'
    WHEN 6 THEN ranked.base_title || ' (Great Benefits) | Join a Fast-Growing Team'
    WHEN 7 THEN ranked.base_title || ' - Salary Review Twice a Year (Hiring Now)'
    WHEN 8 THEN ranked.base_title || ' | Stable Product Company (Attractive Income)'
    WHEN 9 THEN ranked.base_title || ' (Dollar Salary Potential) - Immediate Hiring'
    WHEN 10 THEN ranked.base_title || ' | Career Growth | Excellent Offer'
    WHEN 11 THEN ranked.base_title || ' - Hot Job Opening (Fast Hiring Process)'
    WHEN 12 THEN ranked.base_title || ' (Strong Income) | Long-Term Opportunity'
    WHEN 13 THEN ranked.base_title || ' - Join Our Tech Team | Premium Benefits'
    WHEN 14 THEN ranked.base_title || ' (High Income Potential) - Apply Today'
    WHEN 15 THEN ranked.base_title || ' | Urgent Opening | Attractive Salary Package'
    WHEN 16 THEN ranked.base_title || ' - Thousand-Dollar Salary (Fast Interview)'
    WHEN 17 THEN ranked.base_title || ' | Great Team | Competitive Income | Apply Now'
    WHEN 18 THEN ranked.base_title || ' (Top Employer Choice) - Immediate Start'
    ELSE ranked.base_title || ' | Premium Opportunity | Strong Compensation'
  END,
  "updated_at" = NOW()
FROM ranked
WHERE t.id = ranked.id;

COMMIT;

-- After running this SQL:
-- 1) pnpm run rebuild:recommendation-data
-- 2) refresh embedding again

UPDATE "Recruitment_Infor"
SET "post_title" = SPLIT_PART("post_title", ' | ', 1),
    "updated_at" = NOW();