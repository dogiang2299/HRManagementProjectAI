import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { ChatProfile, JobMatchResult } from "../job-chat.types";
import { JobChatParserService } from "./job-chat-parser.service";

@Injectable()
export class JobChatMatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parserService: JobChatParserService,
  ) {}

  private normalize(value?: string | null): string {
    return this.parserService
      .normalizeText(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private POSITION_GROUP_ALIASES: Record<string, string[]> = {
    business_analyst: [
      "business analyst",
      "it business analyst",
      "ba",
      "system analyst",
      "functional analyst",
      "product analyst",
      "business analysis",
    ],
    frontend_developer: [
      "frontend developer",
      "front end developer",
      "front-end developer",
      "frontend engineer",
      "react developer",
      "vue developer",
      "angular developer",
    ],
    backend_developer: [
      "backend developer",
      "back end developer",
      "back-end developer",
      "backend engineer",
      "nodejs developer",
      "node developer",
      "nestjs developer",
      "java developer",
      ".net developer",
      "php developer",
    ],
    fullstack_developer: [
      "fullstack developer",
      "full stack developer",
      "full-stack developer",
      "fullstack engineer",
    ],
    mobile_developer: [
      "mobile developer",
      "mobile engineer",
      "flutter developer",
      "react native developer",
      "android developer",
      "ios developer",
    ],
    tester_qa: [
      "tester",
      "qa",
      "qc",
      "quality assurance",
      "manual tester",
      "automation tester",
      "test engineer",
    ],
    ui_ux_designer: [
      "ui ux designer",
      "ui/ux designer",
      "ux designer",
      "ui designer",
      "product designer",
    ],
    data_ai: [
      "data analyst",
      "data scientist",
      "data engineer",
      "ai engineer",
      "machine learning engineer",
      "ml engineer",
    ],
    marketing: [
      "marketing executive",
      "digital marketing",
      "marketing specialist",
      "content marketing",
    ],
  };

  private detectPositionGroup(text?: string | null): string | null {
    const normalized = this.normalize(text);
    if (!normalized) return null;

    for (const [group, aliases] of Object.entries(this.POSITION_GROUP_ALIASES)) {
      if (aliases.some((alias) => normalized.includes(this.normalize(alias)))) {
        return group;
      }
    }

    return null;
  }

  private computeTitleScore(profile: ChatProfile, job: any) {
    const desiredPosition = this.normalize(profile.desiredPosition);
    const postTitle = this.normalize(job.post_title);
    const internalTitle = this.normalize(job.internal_title);
    const positionName = this.normalize(job.positionPost?.name_post);
    const groupName = this.normalize(job.positionPost?.group?.name_group);

    if (!desiredPosition) {
      return {
        score: 0,
        sameGroup: false,
      };
    }

    const jobTitleText = [postTitle, internalTitle, positionName, groupName]
      .filter(Boolean)
      .join(" ");

    const userGroup = this.detectPositionGroup(desiredPosition);
    const jobGroup = this.detectPositionGroup(jobTitleText);
    const sameGroup = !!userGroup && !!jobGroup && userGroup === jobGroup;

    if (
      postTitle.includes(desiredPosition) ||
      internalTitle.includes(desiredPosition) ||
      positionName.includes(desiredPosition)
    ) {
      return { score: 1, sameGroup };
    }

    if (sameGroup) {
      return { score: 0.8, sameGroup };
    }

    const desiredTokens = desiredPosition.split(" ").filter(Boolean);
    const titleTokens = jobTitleText.split(" ").filter(Boolean);

    const overlap = desiredTokens.filter((token) => titleTokens.includes(token)).length;
    const tokenScore =
      desiredTokens.length > 0 ? overlap / desiredTokens.length : 0;

    return {
      score: tokenScore,
      sameGroup,
    };
  }

  private computeSkillScore(profile: ChatProfile, job: any): number {
    const profileSkills = (profile.skills ?? [])
      .map((item) => this.normalize(item))
      .filter(Boolean);

    if (!profileSkills.length) return 0;

    const jobSkills = (job.positionPost?.positionSkill ?? [])
      .map((item: any) => this.normalize(item.skill?.name))
      .filter(Boolean);

    if (!jobSkills.length) return 0;

    const matchedSkills = profileSkills.filter((skill) =>
      jobSkills.some(
        (jobSkill: string) =>
          jobSkill.includes(skill) || skill.includes(jobSkill),
      ),
    );

    return matchedSkills.length / profileSkills.length;
  }

  private computeLocationScore(profile: ChatProfile, job: any): number {
    const profileLocation = this.normalize(profile.location);
    if (!profileLocation) return 0.5;

    const jobLocationText = this.normalize(
      [
        job.workLocation?.full_name,
        job.workLocation?.address,
        job.workLocation?.place_of_issue,
        job.department?.full_name,
        job.department?.address,
        job.department?.place_of_issue,
      ]
        .filter(Boolean)
        .join(" "),
    );

    if (!jobLocationText) return 0;

    if (profileLocation === "remote") {
      return jobLocationText.includes("remote") ||
        this.normalize(job.type_of_job).includes("remote")
        ? 1
        : 0;
    }

    return jobLocationText.includes(profileLocation) ? 1 : 0;
  }

  private computeJobTypeScore(profile: ChatProfile, job: any): number {
    const profileJobType = this.normalize(profile.jobType);
    const jobType = this.normalize(job.type_of_job);

    if (!profileJobType) return 0.5;
    if (!jobType) return 0;

    return jobType.includes(profileJobType) ? 1 : 0;
  }

  private computeSalaryScore(profile: ChatProfile, job: any): number {
    if (
      profile.salaryMin === null ||
      profile.salaryMin === undefined ||
      job.salary_to === null ||
      job.salary_to === undefined
    ) {
      return 0.5;
    }

    return Number(job.salary_to) >= Number(profile.salaryMin) ? 1 : 0;
  }

  private computeExperienceScore(profile: ChatProfile, job: any): number {
    if (
      profile.experienceYears === null ||
      profile.experienceYears === undefined
    ) {
      return 0.5;
    }

    const jobExperienceMin =
      job.experience_min ?? job.min_experience_years ?? null;

    if (jobExperienceMin === null || jobExperienceMin === undefined) {
      return 0.5;
    }

    return Number(profile.experienceYears) >= Number(jobExperienceMin) ? 1 : 0;
  }

  async recommendJobs(profile: ChatProfile): Promise<JobMatchResult[]> {
    const jobs = await this.prisma.recruitment_Infor.findMany({
      where: {
        is_active: true,
      },
      include: {
        positionPost: {
          include: {
            group: true,
            positionSkill: {
              include: {
                skill: true,
              },
            },
          },
        },
        rank: true,
        department: true,
        workLocation: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 100,
    });

    return jobs
      .map((job) => this.scoreJob(profile, job))
      .filter((item): item is JobMatchResult => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private scoreJob(profile: ChatProfile, job: any): JobMatchResult | null {
    const reasons: string[] = [];

    const { score: titleScore, sameGroup } = this.computeTitleScore(profile, job);
    const skillScore = this.computeSkillScore(profile, job);
    const locationScore = this.computeLocationScore(profile, job);
    const jobTypeScore = this.computeJobTypeScore(profile, job);
    const salaryScore = this.computeSalaryScore(profile, job);
    const experienceScore = this.computeExperienceScore(profile, job);

    // HARD GATE 1: nếu user đã chọn position rõ rồi mà job không cùng nhóm
    // và title cũng không đủ liên quan => loại luôn
    const hasDesiredPosition = !!this.normalize(profile.desiredPosition);

    if (hasDesiredPosition) {
      const passesPositionGate =
        sameGroup || titleScore >= 0.5;

      if (!passesPositionGate) {
        return null;
      }
    }

    // HARD GATE 2: nếu position đã rõ mà skill cũng không liên quan chút nào
    // thì loại luôn, trừ khi title match cực mạnh
    if (hasDesiredPosition) {
      const passesSkillGate =
        skillScore >= 0.2 || titleScore >= 0.85;

      if (!passesSkillGate) {
        return null;
      }
    }

    // HARD GATE 3: location nếu user đã chọn thì không match là loại
    if (profile.location && locationScore === 0) {
      return null;
    }

    const finalScore =
      titleScore * 45 +
      skillScore * 20 +
      locationScore * 12 +
      salaryScore * 8 +
      jobTypeScore * 8 +
      experienceScore * 7;

    if (sameGroup || titleScore >= 0.85) {
      reasons.push("The job title matches your target position well");
    } else if (titleScore >= 0.5) {
      reasons.push("The role is related to your target position");
    }

    if (skillScore >= 0.2) {
      reasons.push("Your skills are relevant to this role");
    }

    if (locationScore === 1) {
      reasons.push("The location matches your preference");
    }

    if (salaryScore === 1) {
      reasons.push("The salary range may match your expectation");
    }

    if (jobTypeScore === 1) {
      reasons.push("The job type matches your preference");
    }

    if (experienceScore === 1) {
      reasons.push("Your experience level is reasonably suitable for this role");
    }

    // ngưỡng tối thiểu sau khi qua gate
    if (finalScore < 35) {
      return null;
    }

    return {
      recruitmentId: job.id,
      score: Number(finalScore.toFixed(2)),
      reasons,
      recruitment: job,
    };
  }
}