import "dotenv/config";
import * as path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

type TaxonomyRow = {
  node_id?: string;
  parent_id?: string;
  level?: number | string;
  node_name?: string;
  node_type?: string;
  taxonomy_group?: string;
  taxonomy_subgroup?: string;
  occupation_id?: string;
  occupation_name?: string;
  group?: string;
  skill_count?: number | string;
};

type SkillMasterRow = {
  skill_id?: string;
  skill_name?: string;
  skill_type?: string;
  group?: string;
  relation_count?: number | string;
  skill_group?: string;
  skill_subgroup?: string;
  mapped_taxonomy_group?: string;
  mapped_taxonomy_subgroup?: string;
  notes?: string;
};

function readSheet<T = any>(filePath: string, sheetName?: string): T[] {
  const workbook = XLSX.readFile(filePath);
  const targetSheet = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheet];
  return XLSX.utils.sheet_to_json<T>(sheet, { defval: "" });
}

function normalizeText(value?: string | null): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

function slugify(value?: string | null): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function shortHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase();
}

function makePositionCode(occupationId?: string, occupationName?: string): string {
  if (occupationId && String(occupationId).trim()) {
    return truncate(`TAX_POS_${String(occupationId).trim()}`, 50);
  }

  const slug = slugify(occupationName);
  const hash = shortHash(slug || occupationName || "unknown");
  const compact = `TAX_POS_${truncate(slug, 38)}_${hash}`;

  return truncate(compact.toUpperCase(), 50);
}

function safeDescription(parts: Array<string | undefined | null>, max = 300): string | undefined {
  const text = parts.map((x) => normalizeText(x)).filter(Boolean).join(" | ");
  return text ? truncate(text, max) : undefined;
}

async function importPositionGroups(taxonomyRows: TaxonomyRow[]) {
  const groupNames = Array.from(
    new Set(
      taxonomyRows
        .map((r) => normalizeText(r.taxonomy_group || r.group || r.node_name))
        .filter(Boolean),
    ),
  );

  console.log(`\n[1] Import Position_Group: ${groupNames.length} groups`);

  const groupIdByName = new Map<string, string>();

  for (const groupName of groupNames) {
    const slug = truncate(slugify(groupName), 100);
    const safeName = truncate(groupName, 150);
    const safeDescriptionText = truncate("Imported from recommendation taxonomy", 300);

    const group = await prisma.position_Group.upsert({
      where: { slug },
      update: {
        name_group: safeName,
        description: safeDescriptionText,
        updated_at: new Date(),
      },
      create: {
        name_group: safeName,
        slug,
        description: safeDescriptionText,
      },
    });

    groupIdByName.set(groupName, group.id);
  }

  return groupIdByName;
}

async function importPositions(
  taxonomyRows: TaxonomyRow[],
  groupIdByName: Map<string, string>,
) {
  const occupationRows = taxonomyRows.filter((r) => {
    const nodeType = normalizeText(r.node_type).toLowerCase();
    const occupationName = normalizeText(r.occupation_name || r.node_name);
    return nodeType === "occupation" && !!occupationName;
  });

  console.log(`\n[2] Import Setting_Position_Posts: ${occupationRows.length} positions`);

  const positionIdByName = new Map<string, string>();

  for (const row of occupationRows) {
    const occupationName = normalizeText(row.occupation_name || row.node_name);
    const taxonomyGroup = normalizeText(row.taxonomy_group || row.group);
    const positionCode = makePositionCode(row.occupation_id, occupationName);
    const groupId = groupIdByName.get(taxonomyGroup) || null;

    const safeOccupationName = truncate(occupationName, 100);
    const safeDescriptionText = truncate("Imported from recommendation taxonomy", 300);
    const safeStatus = truncate("active", 50);

    if (positionCode.length > 50 || occupationName.length > 100) {
      console.log("⚠️ Position length adjusted:", {
        occupationName,
        occupationNameLength: occupationName.length,
        safeOccupationName,
        safeOccupationNameLength: safeOccupationName.length,
        positionCode,
        positionCodeLength: positionCode.length,
      });
    }

    const position = await prisma.setting_Position_Posts.upsert({
      where: { position_code: positionCode },
      update: {
        name_post: safeOccupationName,
        group_id: groupId,
        description_post: safeDescriptionText,
        status: safeStatus,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        position_code: positionCode,
        name_post: safeOccupationName,
        group_id: groupId,
        description_post: safeDescriptionText,
        status: safeStatus,
        is_active: true,
      },
    });

    positionIdByName.set(occupationName.toLowerCase(), position.id);
  }

  return positionIdByName;
}

async function importSkills(skillRows: SkillMasterRow[]) {
  const cleanRows = skillRows.filter((r) => normalizeText(r.skill_name));

  console.log(`\n[3] Import Skill: ${cleanRows.length} skills`);

  const skillIdByName = new Map<string, string>();

  for (const row of cleanRows) {
    const skillName = normalizeText(row.skill_name);
    const safeSkillName = truncate(skillName, 255);
    const safeSource = truncate("ESCO", 100);
    const description = safeDescription(
      [
        row.skill_group,
        row.skill_subgroup,
        row.mapped_taxonomy_group,
        row.mapped_taxonomy_subgroup,
      ],
      500,
    );

    const skill = await prisma.skill.upsert({
      where: { name: safeSkillName },
      update: {
        source: safeSource,
        description,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        name: safeSkillName,
        source: safeSource,
        description,
        is_active: true,
      },
    });

    skillIdByName.set(skillName.toLowerCase(), skill.id);
  }

  return skillIdByName;
}

async function importSkillAliases(
  skillRows: SkillMasterRow[],
  skillIdByName: Map<string, string>,
) {
  console.log(`\n[4] Import SkillAlias (from notes if any)`);

  let createdOrUpdated = 0;

  for (const row of skillRows) {
    const skillName = normalizeText(row.skill_name);
    const skillId = skillIdByName.get(skillName.toLowerCase());
    if (!skillId) continue;

    const notes = normalizeText(row.notes);
    if (!notes) continue;

    const aliases = notes
      .split(/[;,]/g)
      .map((x) => normalizeText(x))
      .filter(Boolean)
      .filter((x) => x.toLowerCase() !== skillName.toLowerCase());

    for (const alias of aliases) {
      const safeAlias = truncate(alias, 255);

      try {
        await prisma.skillAlias.upsert({
          where: { alias_text: safeAlias },
          update: {
            skill_id: skillId,
          },
          create: {
            skill_id: skillId,
            alias_text: safeAlias,
          },
        });

        createdOrUpdated++;
      } catch (error) {
        console.log(`Skip alias "${safeAlias}" because of conflict/error.`);
      }
    }
  }

  console.log(`Skill aliases imported/updated: ${createdOrUpdated}`);
}

async function main() {
  const baseDir =
    process.argv[2] || path.join(process.cwd(), "uploads", "ai", "import-source");

  const taxonomyPath = path.join(baseDir, "11_occupation_taxonomy_tree_final.xlsx");
  const skillMasterPath = path.join(baseDir, "12_skill_master.xlsx");
  const skillMappingPath = path.join(baseDir, "14_skill_mapping_clean.xlsx");

  console.log("Using import source folder:", baseDir);

  const taxonomyRows = readSheet<TaxonomyRow>(taxonomyPath);
  const skillMasterRows = readSheet<SkillMasterRow>(skillMasterPath);
  const skillMappingRows = readSheet<SkillMasterRow>(skillMappingPath);

  console.log("taxonomyRows:", taxonomyRows.length);
  console.log("skillMasterRows:", skillMasterRows.length);
  console.log("skillMappingRows:", skillMappingRows.length);

  await prisma.$transaction(async () => {
    const groupIdByName = await importPositionGroups(taxonomyRows);
    await importPositions(taxonomyRows, groupIdByName);

    const skillRowsToImport =
      skillMappingRows.length > 0 ? skillMappingRows : skillMasterRows;

    const skillIdByName = await importSkills(skillRowsToImport);
    await importSkillAliases(skillRowsToImport, skillIdByName);
  });

  console.log("\n✅ Import clean recommendation data completed.");
}

main()
  .catch((err) => {
    console.error("❌ Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });