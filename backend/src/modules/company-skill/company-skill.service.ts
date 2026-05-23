import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestActor } from 'src/common/utils/request-actor.util';
import { PrismaService } from 'src/prisma.service';
import {
  CreateCompanySkillDto,
  CreateCustomCompanySkillDto,
} from './dto/create-company-skill.dto';

const companySkillInclude = {
  skill: {
    select: {
      id: true,
      name: true,
      parent_id: true,
      description: true,
      source: true,
      external_code: true,
      is_active: true,
      scope: true,
      company_id: true,
      is_verified: true,
      merged_to_skill_id: true,
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.CompanySkillInclude;

@Injectable()
export class CompanySkillService {
  constructor(private readonly prisma: PrismaService) {}

  private requireCompanyId(actor?: RequestActor): string {
    if (!actor?.company_id) {
      throw new ForbiddenException('No company_id for employer');
    }

    return actor.company_id;
  }

  private normalizeSkillId(skillId?: string | null) {
    const normalized = skillId?.trim();
    if (!normalized) {
      throw new BadRequestException('skill_id is required');
    }

    return normalized;
  }

  private normalizeName(name?: string | null) {
    const normalized = name?.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      throw new BadRequestException('Skill name is required');
    }

    return normalized;
  }

  private async upsertCompanySkill(
    companyId: string,
    skillId: string,
    source: string,
    note?: string,
  ) {
    return this.prisma.companySkill.upsert({
      where: {
        company_id_skill_id: {
          company_id: companyId,
          skill_id: skillId,
        },
      },
      create: {
        company_id: companyId,
        skill_id: skillId,
        is_active: true,
        source,
        note,
      },
      update: {
        is_active: true,
        source,
        ...(typeof note !== 'undefined' ? { note } : {}),
        updated_at: new Date(),
      },
      include: companySkillInclude,
    });
  }

  private async findMatchingGlobalSkill(name: string) {
    const skill = await this.prisma.skill.findFirst({
      where: {
        scope: 'GLOBAL',
        is_active: true,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (skill) return skill;

    const alias = await this.prisma.skillAlias.findFirst({
      where: {
        alias_text: {
          equals: name,
          mode: 'insensitive',
        },
        skill: {
          is: {
            scope: 'GLOBAL',
            is_active: true,
          },
        },
      },
      select: {
        skill: {
          select: {
            id: true,
          },
        },
      },
    });

    return alias?.skill ?? null;
  }

  async findActive(actor?: RequestActor) {
    const companyId = this.requireCompanyId(actor);

    return this.prisma.companySkill.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        skill: {
          is_active: true,
          OR: [
            { scope: 'GLOBAL' },
            { scope: 'COMPANY', company_id: companyId },
          ],
        },
      },
      include: companySkillInclude,
      orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
    });
  }

  async search(keyword = '', actor?: RequestActor) {
    const companyId = this.requireCompanyId(actor);
    const searchText = keyword.trim();

    return this.prisma.companySkill.findMany({
      where: {
        company_id: companyId,
        is_active: true,
        skill: {
          is_active: true,
          OR: [
            { scope: 'GLOBAL' },
            { scope: 'COMPANY', company_id: companyId },
          ],
          ...(searchText
            ? {
                name: {
                  contains: searchText,
                  mode: 'insensitive',
                },
              }
            : {}),
        },
      },
      include: companySkillInclude,
      orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
    });
  }

  async add(body: CreateCompanySkillDto, actor?: RequestActor) {
    const companyId = this.requireCompanyId(actor);
    const skillId = this.normalizeSkillId(body.skill_id);

    const skill = await this.prisma.skill.findFirst({
      where: {
        id: skillId,
        is_active: true,
        OR: [
          { scope: 'GLOBAL' },
          { scope: 'COMPANY', company_id: companyId },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.upsertCompanySkill(
      companyId,
      skillId,
      body.source?.trim() || 'manual',
      body.note,
    );
  }

  async createCustom(body: CreateCustomCompanySkillDto, actor?: RequestActor) {
    const companyId = this.requireCompanyId(actor);
    const name = this.normalizeName(body.name);

    const matchingGlobalSkill = await this.findMatchingGlobalSkill(name);
    if (matchingGlobalSkill) {
      return this.upsertCompanySkill(
        companyId,
        matchingGlobalSkill.id,
        'GLOBAL_MATCH',
      );
    }

    const existingLocalSkill = await this.prisma.skill.findFirst({
      where: {
        scope: 'COMPANY',
        company_id: companyId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    if (existingLocalSkill) {
      return this.upsertCompanySkill(
        companyId,
        existingLocalSkill.id,
        'COMPANY_ADDED',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const skill = await tx.skill.create({
          data: {
            name,
            description: body.description?.trim() || undefined,
            scope: 'COMPANY',
            company_id: companyId,
            is_verified: false,
            source: 'COMPANY_ADDED',
            is_active: true,
          },
          select: {
            id: true,
          },
        });

        return tx.companySkill.upsert({
          where: {
            company_id_skill_id: {
              company_id: companyId,
              skill_id: skill.id,
            },
          },
          create: {
            company_id: companyId,
            skill_id: skill.id,
            is_active: true,
            source: 'COMPANY_ADDED',
          },
          update: {
            is_active: true,
            source: 'COMPANY_ADDED',
            updated_at: new Date(),
          },
          include: companySkillInclude,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(
          'A skill with this name already exists. Search the global library or contact an admin to standardize it.',
        );
      }

      throw error;
    }
  }

  async remove(skillIdParam: string, actor?: RequestActor) {
    const companyId = this.requireCompanyId(actor);
    const skillId = this.normalizeSkillId(skillIdParam);

    const companySkill = await this.prisma.companySkill.findUnique({
      where: {
        company_id_skill_id: {
          company_id: companyId,
          skill_id: skillId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!companySkill) {
      throw new NotFoundException('Company skill not found');
    }

    return this.prisma.companySkill.update({
      where: {
        company_id_skill_id: {
          company_id: companyId,
          skill_id: skillId,
        },
      },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
      include: companySkillInclude,
    });
  }

  async restore(skillIdParam: string, actor?: RequestActor) {
    const companyId = this.requireCompanyId(actor);
    const skillId = this.normalizeSkillId(skillIdParam);

    const companySkill = await this.prisma.companySkill.findUnique({
      where: {
        company_id_skill_id: {
          company_id: companyId,
          skill_id: skillId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!companySkill) {
      throw new NotFoundException('Company skill not found');
    }

    return this.prisma.companySkill.update({
      where: {
        company_id_skill_id: {
          company_id: companyId,
          skill_id: skillId,
        },
      },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
      include: companySkillInclude,
    });
  }
}
