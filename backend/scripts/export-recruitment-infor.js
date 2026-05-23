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

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  return lines.join("\n");
}

async function main() {
  await client.connect();

  const recruitmentResult = await client.query(`
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
      ri.created_at,
      ri.updated_at
    FROM "Recruitment_Infor" ri
    LEFT JOIN "Setting_Position_Posts" spp
      ON spp.id = ri.position_post_id
    LEFT JOIN "Position_Group" pg
      ON pg.id = spp.group_id
    ORDER BY ri.recruitment_code NULLS LAST, ri.created_at DESC
  `);

  const outDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const recruitmentPath = path.join(outDir, "recruitment_infor_export.csv");

  fs.writeFileSync(recruitmentPath, toCsv(recruitmentResult.rows), "utf8");

  console.log("Export xong rồi:");
  console.log(recruitmentPath);

  await client.end();
}

main().catch(async (err) => {
  console.error("Export failed:", err);
  try {
    await client.end();
  } catch (_) {}
  process.exit(1);
});