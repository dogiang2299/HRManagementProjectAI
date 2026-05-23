import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const databaseUrl = (process.env.DATABASE_URL || '').trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing in .env');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '';

  if (value instanceof Date) {
    return `"${value.toISOString()}"`;
  }

  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]) {
  const header = columns.join(',');

  const body = rows.map((row) =>
    columns.map((column) => csvEscape(row[column])).join(','),
  );

  return [header, ...body].join('\n');
}

async function main() {
  const exportDir = path.resolve(process.cwd(), 'exports');

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const skills = await prisma.skill.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  const skillRows = skills.map((item) => ({
    id: item.id,
    name: item.name,
    parent_id: item.parent_id,
    is_active: item.is_active,
    source: item.source,
    external_code: item.external_code,
    unit_id: item.unit_id,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  const skillPath = path.join(exportDir, 'skill_export.csv');

  fs.writeFileSync(
    skillPath,
    toCsv(skillRows, [
      'id',
      'name',
      'parent_id',
      'is_active',
      'source',
      'external_code',
      'unit_id',
      'description',
      'created_at',
      'updated_at',
    ]),
    'utf8',
  );

  const aliases = await prisma.skillAlias.findMany({
    include: {
      skill: {
        select: {
          id: true,
          name: true,
          source: true,
        },
      },
    },
    orderBy: {
      alias_text: 'asc',
    },
  });

  const aliasRows = aliases.map((item) => ({
    alias_id: item.id,
    skill_id: item.skill_id,
    skill_name: item.skill?.name || '',
    skill_source: item.skill?.source || '',
    alias_text: item.alias_text,
    created_at: item.created_at,
  }));

  const aliasPath = path.join(exportDir, 'skill_alias_with_skill_name.csv');

  fs.writeFileSync(
    aliasPath,
    toCsv(aliasRows, [
      'alias_id',
      'skill_id',
      'skill_name',
      'skill_source',
      'alias_text',
      'created_at',
    ]),
    'utf8',
  );

  console.log('Done!');
  console.log(`Skill count: ${skills.length}`);
  console.log(`Alias count: ${aliases.length}`);
  console.log(`Exported: ${skillPath}`);
  console.log(`Exported: ${aliasPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });