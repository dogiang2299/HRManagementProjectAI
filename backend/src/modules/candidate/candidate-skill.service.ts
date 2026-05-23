import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CandidateSkillService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getCandidateSkills(candidateId: string) {
    return this.prisma.candidateSkill.findMany({
      where: { candidate_id: candidateId },
      include: { skill: true },
    });
  }

  async addSkillById(candidateId: string, skillId: string) {
    // create if not exists; skip duplicate errors
    try {
      return await this.prisma.candidateSkill.create({
        data: {
          candidate_id: candidateId,
          skill_id: skillId,
          level: 1,
        },
      });
    } catch (err) {
      // assume duplicate - return existing
      return this.prisma.candidateSkill.findFirst({
        where: { candidate_id: candidateId, skill_id: skillId },
      });
    }
  }

  async addSkillByName(candidateId: string, skillName: string) {
    // find or create skill
    let skill = await this.prisma.skill.findFirst({ where: { name: skillName } });
    if (!skill) {
      skill = await this.prisma.skill.create({ data: { name: skillName, is_active: true } });
    }

    return this.addSkillById(candidateId, skill.id);
  }

  async removeSkill(candidateId: string, skillId: string) {
    return this.prisma.candidateSkill.deleteMany({
      where: { candidate_id: candidateId, skill_id: skillId },
    });
  }
}
