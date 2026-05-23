import { ChatProfile, ChatStep } from './job-chat.types';

export class JobChatEngine {
  static normalizeText(value?: string | null) {
    return (value ?? '').trim().toLowerCase();
  }

  static extractExperienceYears(text: string): number | null {
    const normalized = this.normalizeText(text);

    const match = normalized.match(/(\d+)\s*(năm|year|years)/i);
    if (match) return Number(match[1]);

    if (normalized.includes('fresher')) return 0;
    if (normalized.includes('intern')) return 0;

    return null;
  }

  static extractSkills(text: string): string[] {
    const normalized = this.normalizeText(text);

    const knownSkills = [
      'react',
      'reactjs',
      'typescript',
      'javascript',
      'nodejs',
      'node',
      'nestjs',
      'java',
      'spring boot',
      'sql',
      'mysql',
      'postgresql',
      'figma',
      'ui ux',
      'manual test',
      'automation test',
      'python',
      'ai',
      'machine learning',
      'html',
      'css',
    ];

    return knownSkills.filter((skill) => normalized.includes(skill));
  }

  static extractSalaryRange(text: string): {
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
    return {
      salaryMin: isUSD ? numbers[0] : numbers[0] * 1_000_000,
      salaryMax: isUSD ? numbers[1] : numbers[1] * 1_000_000,
    };
  }

  return {
    salaryMin: isUSD ? numbers[0] : numbers[0] * 1_000_000,
    salaryMax: isUSD ? numbers[0] : numbers[0] * 1_000_000,
  };
}

  static extractJobType(text: string): string | undefined {
    const normalized = this.normalizeText(text);

    if (normalized.includes('full') || normalized.includes('toàn thời gian')) {
      return 'full-time';
    }

    if (normalized.includes('part') || normalized.includes('bán thời gian')) {
      return 'part-time';
    }

    if (normalized.includes('intern') || normalized.includes('thực tập')) {
      return 'intern';
    }

    return undefined;
  }

  static extractLocation(text: string): string | undefined {
    const normalized = this.normalizeText(text);

    if (normalized.includes('hà nội') || normalized.includes('ha noi') || normalized.includes('hn')) {
      return 'Hà Nội';
    }

    if (normalized.includes('hồ chí minh') || normalized.includes('ho chi minh') || normalized.includes('hcm')) {
      return 'Hồ Chí Minh';
    }

    if (normalized.includes('đà nẵng') || normalized.includes('da nang')) {
      return 'Đà Nẵng';
    }

    return text.trim();
  }

  static getNextStep(profile: ChatProfile): ChatStep {
    if (!profile.desiredPosition) return 'ask_position';
    if (!profile.experienceText) return 'ask_experience';
    if (!profile.skills || profile.skills.length === 0) return 'ask_skills';
    if (!profile.location) return 'ask_location';
    if (!profile.salaryMin && !profile.salaryMax) return 'ask_salary';
    if (!profile.jobType) return 'ask_job_type';
    return 'confirm';
  }

  static getBotQuestion(step: ChatStep, profile?: ChatProfile) {
  switch (step) {
    case "ask_position":
      return "What job position are you looking for? For example: Frontend Developer, Backend Developer, Tester, or Business Analyst.";

    case "ask_experience":
      return "How much experience do you have? You can answer like “fresher”, “intern”, or “2 years of frontend experience”.";

    case "ask_skills":
      return "Could you share a few skills or technologies you are confident with? For example: React, TypeScript, Node.js, or SQL.";

    case "ask_location":
      return "Where would you like to work? For example: Hanoi, Ho Chi Minh City, or Da Nang.";

    case "ask_salary":
      return "What salary range are you expecting? For example: 10–15 million VND or 12 million VND.";

    case "ask_job_type":
      return "What type of job are you looking for: full-time, part-time, or internship?";

    case "confirm":
      return "Got it. I have collected your preferences and will now suggest the most suitable jobs for you.";

    default:
      return "I’m ready to help you find a suitable job.";
  }
}
}