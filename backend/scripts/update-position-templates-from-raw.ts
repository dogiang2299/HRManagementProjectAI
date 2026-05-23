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

type RawJobRow = {
  Position?: string;
  "Long Description"?: string;
  "Company Name"?: string;
  "Exp Years"?: string | number;
  "Primary Keyword"?: string;
  "English Level"?: string;
  Published?: string;
  id?: string | number;
};

type CanonicalPositionConfig = {
  canonicalName: string;
  aliases: string[];
};

type PositionTemplateAggregate = {
  canonicalName: string;
  samples: number;
  descriptions: string[];
  requirements: string[];
  benefits: string[];
};

const POSITION_CONFIGS: CanonicalPositionConfig[] = [
  {
    canonicalName: "Backend Developer",
    aliases: [
      "backend developer",
      "backend engineer",
      "back end developer",
      "back-end developer",
      "nodejs developer",
      "node developer",
      "java developer",
      "java backend developer",
      ".net developer",
      ".net backend developer",
      "php developer",
      "golang developer",
      "software developer",
      "web developer",
      "ict application developer",
      "ict system developer",
      "cloud software developer",
      "blockchain developer",
      "e-learning developer",
      "iot developer",
      "embedded systems software developer",
    ],
  },
  {
    canonicalName: "Frontend Developer",
    aliases: [
      "frontend developer",
      "front end developer",
      "front-end developer",
      "frontend engineer",
      "react developer",
      "vue developer",
      "angular developer",
      "user interface developer",
      "web front end developer",
    ],
  },
  {
    canonicalName: "Fullstack Developer",
    aliases: [
      "fullstack developer",
      "full stack developer",
      "full-stack developer",
      "fullstack engineer",
      "full stack engineer",
    ],
  },
  {
    canonicalName: "Business Analyst",
    aliases: [
      "business analyst",
      "ict business analyst",
      "it business analyst",
      "system analyst",
      "functional analyst",
      "product analyst",
      "ba",
    ],
  },
  {
    canonicalName: "Mobile Developer",
    aliases: [
      "mobile developer",
      "mobile application developer",
      "react native developer",
      "flutter developer",
      "ios developer",
      "android developer",
      "industrial mobile devices software developer",
    ],
  },
  {
    canonicalName: "QA Engineer",
    aliases: [
      "qa engineer",
      "qa manual engineer",
      "manual tester",
      "software tester",
      "tester",
      "test engineer",
      "quality assurance engineer",
    ],
  },
  {
    canonicalName: "Automation Tester",
    aliases: [
      "qa automation engineer",
      "automation tester",
      "automation engineer",
      "test automation engineer",
      "selenium tester",
      "cypress tester",
      "playwright tester",
    ],
  },
  {
    canonicalName: "DevOps Engineer",
    aliases: [
      "devops engineer",
      "devops",
      "site reliability engineer",
      "sre",
      "platform engineer",
      "cloud devops engineer",
    ],
  },
  {
    canonicalName: "Cloud Engineer",
    aliases: [
      "cloud engineer",
      "aws engineer",
      "azure engineer",
      "gcp engineer",
      "cloud infrastructure engineer",
    ],
  },
  {
    canonicalName: "Data Analyst",
    aliases: [
      "data analyst",
      "bi analyst",
      "business intelligence analyst",
      "business intelligence manager",
    ],
  },
  {
    canonicalName: "Data Scientist",
    aliases: [
      "data scientist",
      "ai data scientist",
      "machine learning scientist",
    ],
  },
  {
    canonicalName: "AI Engineer",
    aliases: [
      "ai engineer",
      "artificial intelligence engineer",
      "artificial intelligence specialist",
    ],
  },
  {
    canonicalName: "Machine Learning Engineer",
    aliases: [
      "machine learning engineer",
      "ml engineer",
      "mlops engineer",
    ],
  },
  {
    canonicalName: "UI UX Designer",
    aliases: [
      "ui ux designer",
      "ui/ux designer",
      "ux designer",
      "ui designer",
      "product designer",
      "user interface designer",
    ],
  },
  {
    canonicalName: "Product Owner",
    aliases: [
      "product owner",
      "technical product owner",
      "agile product owner",
      "ict product manager",
      "product manager",
    ],
  },
  {
    canonicalName: "IT Support Engineer",
    aliases: [
      "it support engineer",
      "technical support engineer",
      "application support engineer",
      "support engineer",
      "helpdesk engineer",
      "ict trainer",
    ],
  },
  {
    canonicalName: "System Administrator",
    aliases: [
      "system administrator",
      "linux system administrator",
      "windows system administrator",
      "ict system administrator",
      "database administrator",
    ],
  },
  {
    canonicalName: "Network Engineer",
    aliases: [
      "network engineer",
      "network administrator",
      "ict network engineer",
      "ict network administrator",
      "cloud network engineer",
    ],
  },
];

function normalizeText(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanOutputText(value?: string | null, max = 3000): string | null {
  const text = String(value || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) return null;
  return text.length > max ? text.slice(0, max) : text;
}

function readCsv(filePath: string): RawJobRow[] {
  const workbook = XLSX.readFile(filePath, { raw: false });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json<RawJobRow>(sheet, { defval: "" });
}

function splitLines(text?: string | null): string[] {
  return String(text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractSectionByMarkers(
  text: string,
  markers: string[],
  stopMarkers: string[],
): string | null {
  const normalized = text.replace(/\r/g, "\n");
  const lower = normalizeText(normalized);

  let startIndex = -1;
  let matchedMarker = "";

  for (const marker of markers) {
    const markerNorm = normalizeText(marker);
    const idx = lower.indexOf(markerNorm);
    if (idx !== -1 && (startIndex === -1 || idx < startIndex)) {
      startIndex = idx;
      matchedMarker = marker;
    }
  }

  if (startIndex === -1) return null;

  let sliceStart = startIndex + matchedMarker.length;
  let sliceText = normalized.slice(sliceStart);

  let endIndex = -1;
  const lowerSlice = normalizeText(sliceText);

  for (const stop of stopMarkers) {
    const idx = lowerSlice.indexOf(normalizeText(stop));
    if (idx !== -1 && (endIndex === -1 || idx < endIndex)) {
      endIndex = idx;
    }
  }

  if (endIndex !== -1) {
    sliceText = sliceText.slice(0, endIndex);
  }

  return cleanOutputText(sliceText, 2500);
}

function extractDescription(text: string): string | null {
  const stopMarkers = [
    "requirements",
    "requirement",
    "conditions",
    "benefits",
    "we offer",
    "offer",
    "who you are",
    "what we expect",
    "why work with us",
    "what we offer",
    "what we provide",
    "what we are looking for",
    "what professional are we looking for",
    "what will you do",
    "responsibilities",
    "обязанности",
    "требования",
    "условия",
    "почему у нас приятно работать",
    "что для нас важно",
  ];

  const lower = normalizeText(text);
  let cutIndex = -1;

  for (const marker of stopMarkers) {
    const idx = lower.indexOf(normalizeText(marker));
    if (idx !== -1 && (cutIndex === -1 || idx < cutIndex)) {
      cutIndex = idx;
    }
  }

  const candidate = cutIndex !== -1 ? text.slice(0, cutIndex) : text;
  return cleanOutputText(candidate, 1800);
}

function extractRequirement(text: string): string | null {
  const markers = [
    "requirements",
    "requirement",
    "who you are",
    "what we expect",
    "must have",
    "you have",
    "what professional are we looking for",
    "какого профессионала ищем",
    "требования",
    "skills:",
    "tech stack:",
  ];

  const stopMarkers = [
    "conditions",
    "benefits",
    "we offer",
    "offer",
    "why work with us",
    "what we offer",
    "what we provide",
    "почему у нас приятно работать",
    "условия",
  ];

  const direct = extractSectionByMarkers(text, markers, stopMarkers);
  if (direct) return direct;

  const lines = splitLines(text);
  const requirementLike = lines.filter((line) => {
    const l = normalizeText(line);
    return (
      l.startsWith("-") ||
      l.startsWith("•") ||
      l.includes("experience") ||
      l.includes("knowledge") ||
      l.includes("skills") ||
      l.includes("english") ||
      l.includes("communication") ||
      l.includes("sql") ||
      l.includes("react") ||
      l.includes("node") ||
      l.includes("python") ||
      l.includes("docker") ||
      l.includes("kubernetes") ||
      l.includes("figma") ||
      l.includes("analysis")
    );
  });

  return cleanOutputText(requirementLike.slice(0, 12).join("\n"), 2200);
}

function extractBenefits(text: string): string | null {
  const markers = [
    "benefits",
    "conditions",
    "we offer",
    "offer",
    "what we offer",
    "what we provide",
    "why work with us",
    "why you'll love working here",
    "what you get",
    "compensation",
    "perks",
    "почему у нас приятно работать",
    "условия",
  ];

  const stopMarkers: string[] = [];
  const direct = extractSectionByMarkers(text, markers, stopMarkers);
  if (direct) return direct;

  const lines = splitLines(text);
  const benefitLike = lines.filter((line) => {
    const l = normalizeText(line);
    return (
      l.includes("remote") ||
      l.includes("salary") ||
      l.includes("benefit") ||
      l.includes("insurance") ||
      l.includes("vacation") ||
      l.includes("growth") ||
      l.includes("career") ||
      l.includes("flexible") ||
      l.includes("full time") ||
      l.includes("competitive") ||
      l.includes("opportunity") ||
      l.includes("environment") ||
      l.includes("bonus")
    );
  });

  return cleanOutputText(benefitLike.slice(0, 10).join("\n"), 2200);
}

function pickBestText(items: string[]): string | null {
  const cleaned = items
    .map((x) => cleanOutputText(x, 3000))
    .filter(Boolean) as string[];

  if (!cleaned.length) return null;

  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0];
}

function matchCanonicalPosition(rawTitle?: string | null): CanonicalPositionConfig | null {
  const title = normalizeText(rawTitle);
  if (!title) return null;

  let bestMatch: CanonicalPositionConfig | null = null;
  let bestScore = 0;

  for (const config of POSITION_CONFIGS) {
    const allCandidates = [config.canonicalName, ...config.aliases];

    for (const candidate of allCandidates) {
      const candidateNorm = normalizeText(candidate);

      if (title === candidateNorm) {
        return config;
      }

      if (title.includes(candidateNorm) || candidateNorm.includes(title)) {
        const score = candidateNorm.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = config;
        }
      }
    }
  }

  return bestMatch;
}

function isDbPositionMatched(
  dbPositionName: string,
  canonicalName: string,
  aliases: string[],
): boolean {
  const db = normalizeText(dbPositionName);
  const canonical = normalizeText(canonicalName);

  if (!db) return false;

  if (db === canonical || db.includes(canonical) || canonical.includes(db)) {
    return true;
  }

  for (const alias of aliases) {
    const a = normalizeText(alias);
    if (db === a || db.includes(a) || a.includes(db)) {
      return true;
    }
  }

  return false;
}

async function main() {
  const csvPath =
    process.argv[2] ||
    path.join(process.cwd(), "uploads", "ai", "import-source", "job_descriptions_raw.csv");

  console.log("Using raw CSV:", csvPath);

  const rows = readCsv(csvPath);
  console.log("Raw rows:", rows.length);

  const aggregateMap = new Map<string, PositionTemplateAggregate>();

  for (const row of rows) {
    const matched = matchCanonicalPosition(row.Position);
    if (!matched) continue;

    const longDescription = String(row["Long Description"] || "").trim();
    if (!longDescription) continue;

    const description = extractDescription(longDescription);
    const requirement = extractRequirement(longDescription);
    const benefits = extractBenefits(longDescription);

    const current = aggregateMap.get(matched.canonicalName) || {
      canonicalName: matched.canonicalName,
      samples: 0,
      descriptions: [],
      requirements: [],
      benefits: [],
    };

    current.samples += 1;
    if (description) current.descriptions.push(description);
    if (requirement) current.requirements.push(requirement);
    if (benefits) current.benefits.push(benefits);

    aggregateMap.set(matched.canonicalName, current);
  }

  console.log("\nMatched canonical positions:");
  for (const config of POSITION_CONFIGS) {
    const value = aggregateMap.get(config.canonicalName);
    if (value) {
      console.log(`- ${config.canonicalName}: ${value.samples} raw rows`);
    }
  }

  const allDbPositions = await prisma.setting_Position_Posts.findMany();

  for (const config of POSITION_CONFIGS) {
    const aggregate = aggregateMap.get(config.canonicalName);
    if (!aggregate) continue;

    const description = pickBestText(aggregate.descriptions);
    const requirement = pickBestText(aggregate.requirements);
    const benefits = pickBestText(aggregate.benefits);

    if (!description && !requirement && !benefits) {
      console.log(`Skip ${config.canonicalName} because no usable template text found.`);
      continue;
    }

    const matchedDbRows = allDbPositions.filter((row) =>
      isDbPositionMatched(row.name_post || "", config.canonicalName, config.aliases),
    );

    if (!matchedDbRows.length) {
      console.log(`Skip ${config.canonicalName} because no DB rows matched.`);
      continue;
    }

    for (const row of matchedDbRows) {
      const nextDescription =
        row.description_post && row.description_post.trim() &&
        row.description_post.trim() !== "Imported from recommendation taxonomy"
          ? row.description_post
          : description;

      const nextRequirement =
        row.requirements_post && row.requirements_post.trim()
          ? row.requirements_post
          : requirement;

      const nextBenefits =
        row.benefits_post && row.benefits_post.trim()
          ? row.benefits_post
          : benefits;

      const shouldUpdate =
        nextDescription !== row.description_post ||
        nextRequirement !== row.requirements_post ||
        nextBenefits !== row.benefits_post;

      if (!shouldUpdate) {
        console.log(`↷ Skip unchanged ${row.position_code} | ${row.name_post}`);
        continue;
      }

      await prisma.setting_Position_Posts.update({
        where: { id: row.id },
        data: {
          description_post: nextDescription,
          requirements_post: nextRequirement,
          benefits_post: nextBenefits,
          updated_at: new Date(),
        },
      });

      console.log(
        `✅ Updated ${row.position_code} | ${row.name_post} <- ${config.canonicalName}`,
      );
    }
  }

  console.log("\nDone updating position templates from raw CSV.");
}

main()
  .catch((err) => {
    console.error("❌ Update failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });