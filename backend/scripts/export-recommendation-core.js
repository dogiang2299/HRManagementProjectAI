const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  connectionString:
    "postgresql://postgres:123456a%40@localhost:5432/recom_project?schema=public",
});

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);

  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}

async function exportQuery(filename, query) {
  const result = await client.query(query);
  return { filename, rows: result.rows };
}

async function main() {
  await client.connect();

  const outDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const exports = [];

  // 1) Candidate
  exports.push(
    await exportQuery(
      "candidate_export.csv",
      `
      SELECT
        c.id,
        c.candidate_code,
        c.candidate_name,
        c.date_of_birth,
        c.gender,
        c.phone_number,
        c.email,
        c.address,
        c.country,
        c.provice,
        c.district,
        c.date_applied,
        c.referrer_id,
        c.is_active,
        c.is_potential,
        c.potential_type_id,
        c.cv_file,
        c.cv_extracted_text,
        c.cv_uploaded_at,
        c.avatar_file,
        c.avatar_uploaded_at,
        c.created_at,
        c.updated_at,
        c.desired_position_id,
        spp.name_post AS desired_position_name,
        c.career_summary,
        c.desired_rank_id,
        c.preferred_job_type,
        c.status
      FROM "Candidate" c
      LEFT JOIN "Setting_Position_Posts" spp
        ON spp.id = c.desired_position_id
      ORDER BY c.candidate_code NULLS LAST, c.created_at DESC
      `
    )
  );

  // 2) Recruitment_Infor
  exports.push(
    await exportQuery(
      "recruitment_infor_export.csv",
      `
      SELECT
        ri.id,
        ri.recruitment_code,
        ri.internal_title,
        ri.post_title,
        ri.department_id,
        ri.work_location_id,
        ri.rank_id,
        ri.contact_person_id,
        ri.position_post_id,
        spp.position_code,
        spp.name_post,
        spp.group_id,
        pg.name_group,
        ri.type_of_job,
        ri.application_deadline,
        ri.salary_from,
        ri.salary_to,
        ri.salary_currency,
        ri.is_salary_negotiable,
        ri.status,
        ri.experience_type,
        ri.experience_min,
        ri.experience_max,
        ri.experience_label,
        ri.total_needed,
        ri.is_active,
        ri.created_at,
        ri.updated_at
      FROM "Recruitment_Infor" ri
      LEFT JOIN "Setting_Position_Posts" spp
        ON spp.id = ri.position_post_id
      LEFT JOIN "Position_Group" pg
        ON pg.id = spp.group_id
      ORDER BY ri.recruitment_code NULLS LAST, ri.created_at DESC
      `
    )
  );

  // 3) Skill
  exports.push(
    await exportQuery(
      "skill_export.csv",
      `
      SELECT
        s.id,
        s.name,
        s.parent_id,
        ps.name AS parent_skill_name,
        s.unit_id,
        s.source,
        s.external_code,
        s.description,
        s.is_active,
        s.created_at,
        s.updated_at
      FROM "Skill" s
      LEFT JOIN "Skill" ps
        ON ps.id = s.parent_id
      ORDER BY s.name
      `
    )
  );

  // 4) RecruitmentSkill
  exports.push(
    await exportQuery(
      "recruitment_skill_export.csv",
      `
      SELECT
        rs.recruitment_id,
        ri.recruitment_code,
        ri.post_title,
        ri.position_post_id,
        spp.position_code,
        spp.name_post,
        rs.skill_id,
        s.name AS skill_name,
        rs.level,
        rs.is_required
      FROM "RecruitmentSkill" rs
      LEFT JOIN "Recruitment_Infor" ri
        ON ri.id = rs.recruitment_id
      LEFT JOIN "Setting_Position_Posts" spp
        ON spp.id = ri.position_post_id
      LEFT JOIN "Skill" s
        ON s.id = rs.skill_id
      ORDER BY ri.recruitment_code NULLS LAST, s.name
      `
    )
  );

  // 5) Setting_Position_Posts
  exports.push(
    await exportQuery(
      "setting_position_posts_export.csv",
      `
      SELECT
        spp.id,
        spp.position_code,
        spp.name_post,
        spp.group_id,
        pg.name_group,
        spp.unit_id,
        spp.description_post,
        spp.requirements_post,
        spp.benefits_post,
        spp."Setting_Process_Recruitment_id",
        spp.is_active,
        spp.auto_rotation,
        spp.auto_eli_candidate,
        spp.auto_near,
        spp.status,
        spp.created_at,
        spp.updated_at
      FROM "Setting_Position_Posts" spp
      LEFT JOIN "Position_Group" pg
        ON pg.id = spp.group_id
      ORDER BY spp.position_code NULLS LAST, spp.name_post NULLS LAST
      `
    )
  );

  for (const item of exports) {
    const filePath = path.join(outDir, item.filename);
    fs.writeFileSync(filePath, toCsv(item.rows), "utf8");
    console.log("Exported:", filePath);
  }

  await client.end();
  console.log("Xong hết rồi nhé.");
}

main().catch(async (err) => {
  console.error("Export failed:", err);
  try {
    await client.end();
  } catch (_) {}
  process.exit(1);
});