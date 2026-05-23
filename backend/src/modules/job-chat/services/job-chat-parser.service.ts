import { Injectable } from "@nestjs/common";
import {
  ChatProfile,
  ChatStep,
  ParsedChatData,
} from "../job-chat.types";

@Injectable()
export class JobChatParserService {
  normalizeText(value?: string | null): string {
    return (value ?? "").trim().toLowerCase();
  }

  normalizeSpaces(value?: string): string {
    return (value ?? "").replace(/\s+/g, " ").trim();
  }

  extractPosition(text: string): string | undefined {
    const normalized = this.normalizeText(text);

    if (
      normalized.includes("frontend") ||
      normalized.includes("front end") ||
      normalized.includes("front-end") ||
      normalized.includes("react developer")
    ) {
      return "Frontend Developer";
    }

    if (
      normalized.includes("backend") ||
      normalized.includes("back end") ||
      normalized.includes("back-end") ||
      normalized.includes("nestjs") ||
      normalized.includes("nodejs") ||
      normalized.includes("node.js")
    ) {
      return "Backend Developer";
    }

    if (
      normalized.includes("fullstack") ||
      normalized.includes("full stack") ||
      normalized.includes("full-stack")
    ) {
      return "Fullstack Developer";
    }

    if (
      normalized.includes("tester") ||
      normalized.includes("qa") ||
      normalized.includes("kiểm thử") ||
      normalized.includes("kiem thu")
    ) {
      return "Tester";
    }

    if (
      normalized.includes("business analyst") ||
      normalized === "ba" ||
      normalized.includes("nghiệp vụ")
    ) {
      return "Business Analyst";
    }

    if (
      normalized.includes("ui ux") ||
      normalized.includes("ui/ux") ||
      normalized.includes("designer")
    ) {
      return "UI/UX Designer";
    }

    if (
      normalized.includes("data analyst") ||
      normalized.includes("phân tích dữ liệu")
    ) {
      return "Data Analyst";
    }

    if (
      normalized.includes("ai engineer") ||
      normalized.includes("machine learning") ||
      normalized.includes("ml engineer")
    ) {
      return "AI Engineer";
    }
    if (
        normalized.includes("mobile developer") ||
        normalized.includes("mobile engineer") ||
        normalized.includes("flutter developer") ||
        normalized.includes("react native developer") ||
        normalized.includes("android developer") ||
        normalized.includes("ios developer") ||
        normalized.includes("mobile")
        ) {
        return "Mobile Developer";
        }
    return undefined;
  }

  extractExperienceYears(text: string): number | null {
    const normalized = this.normalizeText(text);

    const yearMatch = normalized.match(/(\d+)\s*(năm|year|years)/i);
    if (yearMatch) {
      return Number(yearMatch[1]);
    }

    const monthMatch = normalized.match(/(\d+)\s*(tháng|month|months)/i);
    if (monthMatch) {
      const months = Number(monthMatch[1]);
      if (months < 12) return 0;
      return Math.floor(months / 12);
    }

    if (normalized.includes("fresher")) return 0;
    if (normalized.includes("intern")) return 0;
    if (normalized.includes("thực tập")) return 0;
    if (normalized.includes("mới ra trường")) return 0;

    return null;
  }

  extractSkills(text: string): string[] {
    const normalized = this.normalizeText(text);

    const knownSkills = [
      "react",
      "reactjs",
      "typescript",
      "javascript",
      "html",
      "css",
      "nextjs",
      "vue",
      "angular",
      "nodejs",
      "nestjs",
      "express",
      "java",
      "spring boot",
      "python",
      "sql",
      "mysql",
      "postgresql",
      "mongodb",
      "prisma",
      "jwt",
      "rest api",
      "docker",
      "git",
      "figma",
      "ui ux",
      "manual test",
      "automation test",
      "selenium",
      "cypress",
      "playwright",
      "power bi",
      "excel",
      "machine learning",
      "deep learning",
      "flutter",
"react native",
"swift",
"kotlin",
"android",
"ios",
    ];

    const matched = knownSkills.filter((skill) => normalized.includes(skill));

    return Array.from(
      new Set(
        matched.map((skill) => {
          if (skill === "reactjs") return "react";
          if (skill === "nodejs") return "nodejs";
          if (skill === "ui ux") return "ui/ux";
          return skill;
        }),
      ),
    );
  }

extractLocation(text: string): string | undefined {
  const normalized = this.normalizeText(text);
  const cleaned = this.normalizeSpaces(text);

  if (
    normalized.includes("hanoi") ||
    normalized.includes("ha noi") ||
    normalized.includes("hà nội")
  ) {
    return "Hanoi";
  }

  if (
    normalized.includes("ho chi minh city") ||
    normalized.includes("ho chi minh") ||
    normalized.includes("hồ chí minh") ||
    normalized.includes("hcm") ||
    normalized.includes("sai gon")
  ) {
    return "Ho Chi Minh City";
  }

  if (
    normalized.includes("da nang") ||
    normalized.includes("đà nẵng")
  ) {
    return "Da Nang";
  }

  if (normalized.includes("remote")) {
    return "Remote";
  }

  const locationHints = [
    "work in",
    "work at",
    "working in",
    "working at",
    "located in",
    "based in",
    "location",
    "address",
  ];

  const hasLocationContext = locationHints.some((hint) =>
    normalized.includes(hint),
  );

  const looksLikeAddress =
    /\d+/.test(cleaned) &&
    /(street|st|road|rd|avenue|ave|district|ward|city)/i.test(cleaned);

  if (hasLocationContext || looksLikeAddress) {
    return cleaned;
  }

  return undefined;
}

  extractSalaryRange(text: string): {
    salaryMin: number | null;
    salaryMax: number | null;
  } {
    const normalized = this.normalizeText(text);

    const salaryKeywords = [
      "lương",
      "mức lương",
      "triệu",
      "tr",
      "usd",
      "USD",
      "$",
      "salary",
    ];

    const hasSalaryContext = salaryKeywords.some((keyword) =>
      normalized.includes(keyword),
    );

    if (!hasSalaryContext) {
      return {
        salaryMin: null,
        salaryMax: null,
      };
    }

    const numbers = normalized.match(/\d+/g)?.map(Number) ?? [];

    if (!numbers.length) {
      return {
        salaryMin: null,
        salaryMax: null,
      };
    }

    const isUSD = normalized.includes("usd") || normalized.includes("$");

    if (numbers.length >= 2) {
      const first = isUSD ? numbers[0] : numbers[0] * 1_000_000;
      const second = isUSD ? numbers[1] : numbers[1] * 1_000_000;

      return {
        salaryMin: Math.min(first, second),
        salaryMax: Math.max(first, second),
      };
    }

    const value = isUSD ? numbers[0] : numbers[0] * 1_000_000;

    return {
      salaryMin: value,
      salaryMax: value,
    };
  }

extractJobType(text: string): string | undefined {
  const normalized = this.normalizeText(text);

  const jobTypeIntentHints = [
    "looking for",
    "i want",
    "i prefer",
    "job type",
    "position type",
    "work type",
    "full-time job",
    "part-time job",
    "internship",
  ];

  const hasJobTypeIntent = jobTypeIntentHints.some((hint) =>
    normalized.includes(hint),
  );

  if (!hasJobTypeIntent) {
    return undefined;
  }

  if (
    normalized.includes("full-time") ||
    normalized.includes("full time") ||
    normalized.includes("fulltime")
  ) {
    return "full-time";
  }

  if (
    normalized.includes("part-time") ||
    normalized.includes("part time") ||
    normalized.includes("parttime")
  ) {
    return "part-time";
  }

  if (
    normalized.includes("internship") ||
    normalized.includes("intern")
  ) {
    return "internship";
  }

  return undefined;
}

  extractAllFromMessage(text: string): ParsedChatData {
    const desiredPosition = this.extractPosition(text);
    const experienceYears = this.extractExperienceYears(text);
    const skills = this.extractSkills(text);
    const location = this.extractLocation(text);
    const salary = this.extractSalaryRange(text);
    const jobType = this.extractJobType(text);

    return {
      desiredPosition,
      experienceText:
        experienceYears !== null ? this.normalizeSpaces(text) : undefined,
      experienceYears,
      skills,
      location,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      jobType,
    };
  }

mergeExtractedDataIntoProfile(
  profile: ChatProfile,
  step: ChatStep,
  message: string,
): ChatProfile {
  const extracted = this.extractAllFromMessage(message);

  // position: có thể cho phép cập nhật linh hoạt
  if (extracted.desiredPosition) {
    profile.desiredPosition = extracted.desiredPosition;
  }

  // experience: chỉ cập nhật khi thực sự extract được số năm / fresher / intern
  if (
    extracted.experienceText &&
    extracted.experienceYears !== null &&
    extracted.experienceYears !== undefined
  ) {
    profile.experienceText = extracted.experienceText;
    profile.experienceYears = extracted.experienceYears;
  }

  // skills: chỉ merge mạnh khi đang ở bước ask_skills
  if (step === "ask_skills" && extracted.skills.length) {
    const currentSkills = profile.skills ?? [];
    profile.skills = Array.from(
      new Set(
        [...currentSkills, ...extracted.skills]
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }

  // location: chỉ merge mạnh khi đang ở bước ask_location
  if (step === "ask_location" && extracted.location) {
    profile.location = extracted.location;
  }

  // salary: chỉ merge mạnh khi đang ở bước ask_salary
  if (
    step === "ask_salary" &&
    extracted.salaryMin !== null &&
    extracted.salaryMin !== undefined
  ) {
    profile.salaryMin = extracted.salaryMin;
    profile.salaryMax = extracted.salaryMax;
  }

  // job type: chỉ merge mạnh khi đang ở bước ask_job_type
  if (step === "ask_job_type" && extracted.jobType) {
    profile.jobType = extracted.jobType;
  }

  // fallback theo step
  switch (step) {
    case "ask_position":
      if (!profile.desiredPosition) {
        profile.desiredPosition = this.normalizeSpaces(message);
      }
      break;

    case "ask_experience":
      if (
        profile.experienceYears === null ||
        profile.experienceYears === undefined
      ) {
        profile.experienceText = this.normalizeSpaces(message);
        profile.experienceYears = this.extractExperienceYears(message);
      }
      break;

    case "ask_skills":
      if ((!profile.skills || profile.skills.length === 0) && message.trim()) {
        profile.skills = message
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      break;

    case "ask_location":
      if (!profile.location) {
        const location = this.extractLocation(message);
        if (location) {
          profile.location = location;
        }
      }
      break;

    case "ask_salary":
      if (
        profile.salaryMin === null ||
        profile.salaryMin === undefined
      ) {
        const salary = this.extractSalaryRange(message);
        profile.salaryMin = salary.salaryMin;
        profile.salaryMax = salary.salaryMax;
      }
      break;

    case "ask_job_type":
      if (!profile.jobType) {
        profile.jobType =
          this.extractJobType(message) || this.normalizeSpaces(message);
      }
      break;

    default:
      break;
  }

  return profile;
}

  getNextStep(profile: ChatProfile): ChatStep {
    if (!profile.desiredPosition) return "ask_position";

    if (
      profile.experienceYears === null ||
      profile.experienceYears === undefined
    ) {
      return "ask_experience";
    }

    if (!profile.skills || profile.skills.length === 0) {
      return "ask_skills";
    }

    if (!profile.location) {
      return "ask_location";
    }

    if (
      profile.salaryMin === null ||
      profile.salaryMin === undefined
    ) {
      return "ask_salary";
    }

    if (!profile.jobType) {
      return "ask_job_type";
    }

    return "confirm";
  }

  getBotQuestion(step: ChatStep): string {
  switch (step) {
    case "ask_position":
      return "What job position are you looking for? For example: Frontend Developer, Backend Developer, Tester, or Business Analyst.";

    case "ask_experience":
      return "How much experience do you have? You can answer like “fresher”, “intern”, or “2 years of backend development”.";

    case "ask_skills":
      return "Could you share a few skills or technologies you are confident with? For example: React, TypeScript, Node.js, SQL, or PostgreSQL.";

    case "ask_location":
      return "Where would you like to work? For example: Hanoi, Ho Chi Minh City, Da Nang, or remote.";

    case "ask_salary":
      return "What salary range are you expecting? For example: 10-15 million VND, 15 million VND, or 800-1200 USD.";

    case "ask_job_type":
      return "What type of job are you looking for: full-time, part-time, or internship?";

    case "confirm":
      return "Got it. I have collected your preferences and will now suggest the most suitable jobs for you.";

    case "completed":
      return "I have finished generating job suggestions for you.";

    default:
      return "I’m ready to help you find a suitable job.";
  }
}
}