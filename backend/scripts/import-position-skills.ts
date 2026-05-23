import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Client } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  // Có thể truyền path riêng:
  // POSITION_SKILL_SQL_PATH=./scripts/sql/position-skills.sql
  const inputPath =
    process.env.POSITION_SKILL_SQL_PATH ||
    process.argv[2] ||
    './scripts/sql/position-skills.sql';

  const absolutePath = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);

  console.log(`Reading SQL file: ${absolutePath}`);

  const sql = await fs.readFile(absolutePath, 'utf8');
  if (!sql.trim()) {
    throw new Error('SQL file is empty');
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    console.log('Importing PositionSkill...');
    await client.query(sql);

    const countResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM "PositionSkill";',
    );

    const total = countResult.rows?.[0]?.count ?? 0;

    console.log('=== IMPORT POSITION SKILLS DONE ===');
    console.log(`Total PositionSkill rows: ${total}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Import PositionSkill failed');
  console.error(error);
  process.exit(1);
});