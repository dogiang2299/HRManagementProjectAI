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

  const skillResult = await client.query(`
    SELECT
      id,
      name,
      parent_id,
      unit_id,
      source,
      external_code,
      description,
      is_active,
      created_at,
      updated_at
    FROM "Skill"
    ORDER BY name
  `);

  const positionResult = await client.query(`
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
  `);

  const outDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const skillPath = path.join(outDir, "skills_export.csv");
  const positionPath = path.join(outDir, "setting_position_posts_export.csv");

  fs.writeFileSync(skillPath, toCsv(skillResult.rows), "utf8");
  fs.writeFileSync(positionPath, toCsv(positionResult.rows), "utf8");

  console.log("Export xong rồi:");
  console.log(skillPath);
  console.log(positionPath);

  await client.end();
}

main().catch(async (err) => {
  console.error("Export failed:", err);
  try {
    await client.end();
  } catch (_) {}
  process.exit(1);
});