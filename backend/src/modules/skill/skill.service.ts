import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Skill } from '@prisma/client';
import { SkillFilterType } from './dto/filter_type';
import { SkillPaginType } from './dto/pagin_type';
import { CreateSkillDto } from './dto/create';
import { UpdateSkillDto } from './dto/update';

@Injectable()
export class SkillService {
  constructor(private prisma: PrismaService) {}

  private getCompanyId(actor?: any): string | null {
    return actor?.company_id ?? null;
  }

  private normalizeScope(scope?: string | null) {
    const normalized = scope?.trim().toUpperCase();
    if (normalized === 'COMPANY') return 'COMPANY';
    if (normalized === 'ALL') return 'ALL';
    return 'GLOBAL';
  }

  async create(data: CreateSkillDto, actor?: any) {
    return this.createRecursive(data, null, data.unit_id ?? null);
  }

private async createRecursive(
  data: CreateSkillDto,
  parentId: string | null,
  unitId: string | null,
) {
  const normalizedName = data.name?.trim();
  if (!normalizedName) {
    throw new HttpException('Skill name is required', HttpStatus.BAD_REQUEST);
  }

  let skill: Skill;
  const scope = this.normalizeScope(data.scope) === 'COMPANY' ? 'COMPANY' : 'GLOBAL';
  const companyId = scope === 'COMPANY' ? data.company_id ?? unitId ?? null : null;

  try {
    skill = await this.prisma.skill.create({
      data: {
        name: normalizedName,
        description: data.description?.trim() || undefined,
        source: data.source?.trim() || undefined,
        parent_id: parentId,
        is_active: data.is_active ?? true,
        unit_id: data.unit_id ?? unitId ?? undefined,
        scope,
        company_id: companyId ?? undefined,
        is_verified: data.is_verified ?? (scope === 'GLOBAL'),
        merged_to_skill_id: data.merged_to_skill_id ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpException(`Skill \"${normalizedName}\" already exists`, HttpStatus.CONFLICT);
    }
    throw error;
  }

  if (data.children && data.children.length > 0) {
    for (const child of data.children) {
      await this.createRecursive(child, skill.id, skill.unit_id ?? unitId ?? null);
    }
  }

  return skill;
}
  async getAll(params: SkillFilterType, actor?: any): Promise<SkillPaginType> {
    const {
      search,
      pages = 1,
      items_per_pages = 10,
      scope: rawScope,
      company_id,
      unit_id,
    } = params;

    const skip = (pages - 1) * items_per_pages;
    const scope = this.normalizeScope(rawScope);

    const whereCondition: any = {
      is_active: true,
    };

    if (scope !== 'ALL') {
      whereCondition.scope = scope;
    }

    if (company_id) {
      whereCondition.company_id = company_id;
    }

    if (unit_id) {
      whereCondition.unit_id = unit_id;
    }

    if (search) {
      whereCondition.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [data, total_items] = await Promise.all([
      this.prisma.skill.findMany({
        where: whereCondition,
        skip,
        take: items_per_pages,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          inforCompany: {
            select: {
              id: true,
              full_name: true,
              acronym_name: true,
            },
          },
          companyOwner: {
            select: {
              id: true,
              full_name: true,
              acronym_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.skill.count({ where: whereCondition }),
    ]);

    return {
      data,
      current_pages: pages,
      items_per_pages,
      total_items,
    };
  }

  async globalSearch(keyword?: string, limit = 20, actor?: any) {
    const searchText = keyword?.trim() || '';
    if (!searchText) return [];

    const requestedLimit = Number(limit);
    const take = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(30, Math.floor(requestedLimit)))
      : 20;

    const companyId = this.getCompanyId(actor);
    const activeCompanySkillIds = companyId
      ? await this.prisma.companySkill.findMany({
          where: {
            company_id: companyId,
            is_active: true,
          },
          select: {
            skill_id: true,
          },
        })
      : [];
    const excludedSkillIds = activeCompanySkillIds.map((item) => item.skill_id);

    return this.prisma.skill.findMany({
      where: {
        is_active: true,
        scope: 'GLOBAL',
        ...(excludedSkillIds.length ? { id: { notIn: excludedSkillIds } } : {}),
        name: {
          contains: searchText,
          mode: 'insensitive',
        },
      },
      take,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        scope: true,
        is_verified: true,
      },
    });
  }

  async getById(id: string, actor?: any): Promise<Skill | null> {
    return this.prisma.skill.findFirst({
      where: { id },
      include: {
        children: true,
        parent: true,
        inforCompany: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
          },
        },
        companyOwner: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
          },
        },
      },
    });
  }
  async update(id: string, data: UpdateSkillDto, actor?: any): Promise<Skill> {
  const companyId = this.getCompanyId(actor);
  const skill = await this.prisma.skill.findFirst({
    where: { id, ...(companyId ? { unit_id: companyId } : {}) },
    include: { children: true }, 
  });

  if (!skill) {
    throw new HttpException('Skill không tồn tại', HttpStatus.BAD_REQUEST);
  }

  if (data.parent_id === id) {
    throw new HttpException('Skill cannot be its own parent', HttpStatus.BAD_REQUEST);
  }

  const dataUpdate: Prisma.SkillUncheckedUpdateInput = {
    updated_at: new Date(),
  };

  if (typeof data.name === 'string') {
    const normalizedName = data.name.trim();
    if (!normalizedName) {
      throw new HttpException('Skill name is required', HttpStatus.BAD_REQUEST);
    }
    dataUpdate.name = normalizedName;
  }

  if (typeof data.parent_id !== 'undefined') {
    dataUpdate.parent_id = data.parent_id;
  }

  if (typeof data.unit_id !== 'undefined') {
    dataUpdate.unit_id = data.unit_id ?? companyId ?? null;
  }

  if (typeof data.description !== 'undefined') {
    dataUpdate.description = data.description?.trim() || null;
  }

  if (typeof data.source !== 'undefined') {
    dataUpdate.source = data.source?.trim() || null;
  }

  if (typeof data.scope === 'string') {
    const scope = this.normalizeScope(data.scope);
    dataUpdate.scope = scope === 'ALL' ? 'GLOBAL' : scope;
  }

  if (typeof data.company_id !== 'undefined') {
    dataUpdate.company_id = data.company_id ?? null;
  }

  if (typeof data.is_verified === 'boolean') {
    dataUpdate.is_verified = data.is_verified;
  }

  if (typeof data.merged_to_skill_id !== 'undefined') {
    dataUpdate.merged_to_skill_id = data.merged_to_skill_id ?? null;
  }

  if (typeof data.is_active === 'boolean') {
    dataUpdate.is_active = data.is_active;
  }

  let updatedSkill: Skill;
  try {
    updatedSkill = await this.prisma.skill.update({
      where: { id },
      data: dataUpdate,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new HttpException('Skill name already exists', HttpStatus.CONFLICT);
    }
    throw error;
  }

  if (data.children && data.children.length > 0) {
    for (const child of data.children) {
      if (child.id) {
        await this.update(child.id, child, actor);
      } else {
        await this.createRecursive(child, updatedSkill.id, updatedSkill.unit_id ?? data.unit_id ?? null);
      }
    }
  }

  return updatedSkill;
}
  async delete(id: string, actor?: any): Promise<Skill> {
    const companyId = this.getCompanyId(actor);
    const skill = await this.prisma.skill.findFirst({
      where: { id, ...(companyId ? { unit_id: companyId } : {}) },
      select: { id: true },
    });

    if (!skill) {
      throw new HttpException('Skill không tồn tại', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.skill.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }
  async getTree(actor?: any) {
    const skills = await this.prisma.skill.findMany({
      where: {
        is_active: true,
        scope: 'GLOBAL',
      },
      orderBy: { created_at: 'asc' },
    });

    const map = new Map();

    skills.forEach(skill => {
      map.set(skill.id, { ...skill, children: [] });
    });

    const tree: any[] = [];

    skills.forEach(skill => {
      if (skill.parent_id) {
        const parent = map.get(skill.parent_id);
        if (parent) {
          parent.children.push(map.get(skill.id));
        }
      } else {
        tree.push(map.get(skill.id));
      }
    });

    return tree;
  }
}
