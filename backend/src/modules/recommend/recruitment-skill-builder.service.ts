import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RecruitmentSkillBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async rebuildAllRecruitmentSkills() {
    const jobs = await this.prisma.recruitment_Infor.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        recruitment_code: true,
        position_post_id: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    let rebuilt = 0;
    let totalInserted = 0;

    for (const job of jobs) {
      const result = await this.rebuildRecruitmentSkillsForJob(
        job.id,
        job.position_post_id!,
      );
      rebuilt++;
      totalInserted += result.inserted;
    }

    return {
      totalJobs: jobs.length,
      rebuiltJobs: rebuilt,
      totalInsertedSkills: totalInserted,
    };
  }

  async rebuildRecruitmentSkillsForJob(
    recruitmentId: string,
    positionPostId: string,
  ) {
    const positionSkills = await this.prisma.positionSkill.findMany({
      where: {
        position_id: positionPostId,
      },
      select: {
        skill_id: true,
        level: true,
        is_required: true,
      },
    });

    await this.prisma.recruitmentSkill.deleteMany({
      where: {
        recruitment_id: recruitmentId,
      },
    });

    if (!positionSkills.length) {
      return {
        recruitmentId,
        inserted: 0,
      };
    }

    await this.prisma.recruitmentSkill.createMany({
      data: positionSkills.map((item) => ({
        recruitment_id: recruitmentId,
        skill_id: item.skill_id,
        level: item.level ?? 1,
        is_required: item.is_required ?? true,
      })),
      skipDuplicates: true,
    });

    return {
      recruitmentId,
      inserted: positionSkills.length,
    };
  }
}