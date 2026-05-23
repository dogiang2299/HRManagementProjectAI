import { NestFactory } from '@nestjs/core';
import * as XLSX from 'xlsx';

import { AppModule } from '../src/app.module';
import { PrismaService } from 'src/prisma.service';

const EXCEL_PATH =
  '/Users/nguyenduykhanh/Documents/GraduationProject/Recommendation_Project/recommendation/notebook/DataXomy/ESCO_taxonomy/notebook_clean/14_skill_mapping_clean.xlsx';

const SOURCE = '14_skill_mapping_clean';

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

async function main() {
  console.log('=== IMPORT SKILL TAXONOMY MAPPING START ===');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<any>(sheet, {
    defval: null,
  });

  console.log(`Excel rows: ${rows.length}`);

  const skills = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id::text AS id, name
    FROM "Skill"
    WHERE name IS NOT NULL
  `);

  const skillByName = new Map<string, string>();

  for (const skill of skills) {
    skillByName.set(normalizeText(skill.name), skill.id);
  }

  let aliases: any[] = [];

  try {
    aliases = await prisma.$queryRawUnsafe<any[]>(`
      SELECT skill_id::text AS skill_id, alias_text
      FROM "SkillAlias"
      WHERE alias_text IS NOT NULL
    `);
  } catch (error) {
    console.warn('Không đọc được bảng SkillAlias hoặc cột alias_text. Bỏ qua alias matching.');
  }

  const skillByAlias = new Map<string, string>();

  for (const alias of aliases) {
    skillByAlias.set(normalizeText(alias.alias_text), alias.skill_id);
  }

  await prisma.$executeRawUnsafe(`
    DELETE FROM "SkillTaxonomyMapping"
    WHERE source = '${SOURCE}'
  `);

  let inserted = 0;
  let skippedNoTaxonomy = 0;
  let unmatched = 0;

  const unmatchedSamples: string[] = [];

  for (const row of rows) {
    const skillName = String(row.skill_name ?? '').trim();
    const taxonomyGroup = String(row.mapped_taxonomy_group ?? '').trim();
    const taxonomySubgroup = String(row.mapped_taxonomy_subgroup ?? '').trim();

    if (!skillName || !taxonomyGroup) {
      skippedNoTaxonomy++;
      continue;
    }

    const normalizedSkillName = normalizeText(skillName);

    const skillId =
      skillByName.get(normalizedSkillName) ||
      skillByAlias.get(normalizedSkillName);

    if (!skillId) {
      unmatched++;

      if (unmatchedSamples.length < 30) {
        unmatchedSamples.push(skillName);
      }

      continue;
    }

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "SkillTaxonomyMapping" (
          skill_id,
          taxonomy_group,
          taxonomy_subgroup,
          source,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          NOW(),
          NOW()
        )
        ON CONFLICT (skill_id, taxonomy_group, taxonomy_subgroup)
        DO UPDATE SET
          source = EXCLUDED.source,
          updated_at = NOW()
      `,
      skillId,
      taxonomyGroup,
      taxonomySubgroup || null,
      SOURCE,
    );

    inserted++;
  }

  const totalInDb = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*)::int AS total
    FROM "SkillTaxonomyMapping"
  `);

  console.log('=== IMPORT RESULT ===');
  console.log(`Inserted/updated: ${inserted}`);
  console.log(`Skipped no taxonomy: ${skippedNoTaxonomy}`);
  console.log(`Unmatched skill_name: ${unmatched}`);
  console.log(`Total mappings in DB: ${totalInDb[0]?.total ?? 0}`);

  if (unmatchedSamples.length > 0) {
    console.log('\nUnmatched samples:');
    for (const sample of unmatchedSamples) {
      console.log(`- ${sample}`);
    }
  }

  console.log('=== IMPORT SKILL TAXONOMY MAPPING DONE ===');
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exitCode = 1;
});