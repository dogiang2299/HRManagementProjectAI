import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Skill } from '@prisma/client';
import { SkillFilterType } from './dto/filter_type';
import { SkillPaginType } from './dto/pagin_type';
import { CreateSkillDto } from './dto/create';
import { UpdateSkillDto } from './dto/update';
import { CreateTaxonomyNodeDto } from './dto/create-taxonomy-node';
import { UpdateTaxonomyNodeDto } from './dto/update-taxonomy-node';

const ADMIN_TAXONOMY_SOURCE = 'admin_taxonomy_crud';
const ADMIN_TAXONOMY_NODE_SOURCE = 'admin_taxonomy_node_mapping';

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

  private normalizeText(value?: string | null) {
    return value?.trim().replace(/\s+/g, ' ') || '';
  }

  private normalizeAliases(aliases?: string[] | null) {
    if (!Array.isArray(aliases)) return [];

    const seen = new Set<string>();
    const result: string[] = [];

    for (const alias of aliases) {
      const normalized = this.normalizeText(alias);
      const key = normalized.toLowerCase();

      if (!normalized || seen.has(key)) continue;

      seen.add(key);
      result.push(normalized);
    }

    return result;
  }

  private normalizeTaxonomyInput(data: {
    taxonomy_group?: string | null;
    taxonomy_subgroup?: string | null;
  }) {
    const taxonomyGroup = this.normalizeText(data.taxonomy_group);
    const taxonomySubgroup = this.normalizeText(data.taxonomy_subgroup);

    if (!taxonomyGroup) {
      throw new HttpException('Taxonomy group is required', HttpStatus.BAD_REQUEST);
    }

    if (!taxonomySubgroup) {
      throw new HttpException('Taxonomy subgroup is required', HttpStatus.BAD_REQUEST);
    }

    return {
      taxonomyGroup,
      taxonomySubgroup,
    };
  }

  private async assertAliasOwnership(
    tx: Prisma.TransactionClient,
    skillId: string,
    aliases: string[],
  ) {
    for (const alias of aliases) {
      const existing = await tx.skillAlias.findFirst({
        where: {
          alias_text: {
            equals: alias,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          skill_id: true,
          alias_text: true,
        },
      });

      if (existing && existing.skill_id !== skillId) {
        throw new HttpException(
          `Alias "${alias}" already belongs to another skill`,
          HttpStatus.CONFLICT,
        );
      }
    }
  }

  private async replaceSkillAliasesCaseInsensitive(
    tx: Prisma.TransactionClient,
    skillId: string,
    aliases?: string[] | null,
  ) {
    const normalizedAliases = this.normalizeAliases(aliases);
    const desiredKeys = new Set(normalizedAliases.map((a) => a.toLowerCase()));

    await this.assertAliasOwnership(tx, skillId, normalizedAliases);

    const existing = await tx.skillAlias.findMany({
      where: { skill_id: skillId },
      select: { id: true, alias_text: true },
    });

    const toDeleteIds: string[] = [];
    for (const row of existing) {
      const key = (row.alias_text || '').toLowerCase();
      if (!desiredKeys.has(key)) {
        toDeleteIds.push(row.id);
      }
    }

    if (toDeleteIds.length) {
      await tx.skillAlias.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
    }

    for (const alias of normalizedAliases) {
      const found = await tx.skillAlias.findFirst({
        where: {
          alias_text: {
            equals: alias,
            mode: 'insensitive',
          },
        },
        select: { id: true, skill_id: true, alias_text: true },
      });

      if (found) {
        // Keep single row per alias (case-insensitive) and normalize casing/spaces.
        await tx.skillAlias.update({
          where: { id: found.id },
          data: {
            skill_id: skillId,
            alias_text: alias,
          },
        });
      } else {
        await tx.skillAlias.create({
          data: {
            skill_id: skillId,
            alias_text: alias,
          },
        });
      }
    }
  }

  private async replaceSkillAliases(
    tx: Prisma.TransactionClient,
    skillId: string,
    aliases?: string[] | null,
  ) {
    const normalizedAliases = this.normalizeAliases(aliases);

    await this.assertAliasOwnership(tx, skillId, normalizedAliases);

    await tx.skillAlias.deleteMany({
      where: {
        skill_id: skillId,
        ...(normalizedAliases.length
          ? {
              alias_text: {
                notIn: normalizedAliases,
              },
            }
          : {}),
      },
    });

    for (const alias of normalizedAliases) {
      await tx.skillAlias.upsert({
        where: {
          alias_text: alias,
        },
        create: {
          skill_id: skillId,
          alias_text: alias,
        },
        update: {
          skill_id: skillId,
        },
      });
    }
  }

  private async replaceSkillTaxonomyMapping(
    tx: Prisma.TransactionClient,
    skillId: string,
    taxonomyGroup: string,
    taxonomySubgroup: string,
  ) {
    const mapping = await tx.skillTaxonomyMapping.upsert({
      where: {
        skill_id_taxonomy_group_taxonomy_subgroup: {
          skill_id: skillId,
          taxonomy_group: taxonomyGroup,
          taxonomy_subgroup: taxonomySubgroup,
        },
      },
      create: {
        skill_id: skillId,
        taxonomy_group: taxonomyGroup,
        taxonomy_subgroup: taxonomySubgroup,
        source: ADMIN_TAXONOMY_SOURCE,
      },
      update: {
        source: ADMIN_TAXONOMY_SOURCE,
        updated_at: new Date(),
      },
    });

    await tx.skillTaxonomyMapping.deleteMany({
      where: {
        skill_id: skillId,
        id: {
          not: mapping.id,
        },
      },
    });
  }

  private async replaceSkillTaxonomyNodeMapping(
    tx: Prisma.TransactionClient,
    skillId: string,
    taxonomyGroupNodeId: string,
    taxonomySubgroupNodeId: string,
  ) {
    const groupNode = await tx.skillTaxonomyNode.findUnique({
      where: { id: taxonomyGroupNodeId },
      select: {
        id: true,
        name: true,
        node_type: true,
        parent_id: true,
      },
    });

    if (!groupNode || groupNode.node_type !== 'GROUP' || groupNode.parent_id) {
      throw new HttpException('Invalid taxonomy group node', HttpStatus.BAD_REQUEST);
    }

    const subgroupNode = await tx.skillTaxonomyNode.findUnique({
      where: { id: taxonomySubgroupNodeId },
      select: {
        id: true,
        name: true,
        node_type: true,
        parent_id: true,
      },
    });

    if (
      !subgroupNode ||
      subgroupNode.node_type !== 'SUBGROUP' ||
      subgroupNode.parent_id !== groupNode.id
    ) {
      throw new HttpException(
        'Invalid taxonomy subgroup node for selected group',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingMappings = await tx.skillTaxonomyMapping.findMany({
      where: { skill_id: skillId },
      select: { id: true, created_at: true },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });

    if (existingMappings.length === 0) {
      await tx.skillTaxonomyMapping.create({
        data: {
          skill_id: skillId,
          taxonomy_group_node_id: groupNode.id,
          taxonomy_subgroup_node_id: subgroupNode.id,
          taxonomy_group: groupNode.name,
          taxonomy_subgroup: subgroupNode.name,
          source: ADMIN_TAXONOMY_NODE_SOURCE,
        },
      });
      return;
    }

    const keeperId = existingMappings[0].id;
    await tx.skillTaxonomyMapping.update({
      where: { id: keeperId },
      data: {
        taxonomy_group_node_id: groupNode.id,
        taxonomy_subgroup_node_id: subgroupNode.id,
        taxonomy_group: groupNode.name,
        taxonomy_subgroup: subgroupNode.name,
        source: ADMIN_TAXONOMY_NODE_SOURCE,
        updated_at: new Date(),
      },
    });

    if (existingMappings.length > 1) {
      await tx.skillTaxonomyMapping.deleteMany({
        where: {
          skill_id: skillId,
          id: { not: keeperId },
        },
      });
    }
  }

  private getSkillSelect() {
    return {
      id: true,
      name: true,
      description: true,
      parent_id: true,
      is_active: true,
      scope: true,
      source: true,
      unit_id: true,
      company_id: true,
      is_verified: true,
      created_at: true,
      updated_at: true,
      aliases: {
        select: {
          id: true,
          alias_text: true,
        },
        orderBy: {
          alias_text: 'asc' as const,
        },
      },
      taxonomyMappings: {
        select: {
          id: true,
          taxonomy_group: true,
          taxonomy_subgroup: true,
          taxonomy_group_node_id: true,
          taxonomy_subgroup_node_id: true,
          source: true,
        },
        orderBy: [
          { taxonomy_group: 'asc' as const },
          { taxonomy_subgroup: 'asc' as const },
        ],
      },
    };
  }

  async create(data: CreateSkillDto, actor?: any) {
    // Management create (single skill) supports aliases + taxonomy node mapping
    const isSingleSkillCreate = !Array.isArray(data.children) || data.children.length === 0;
    const taxonomyGroupNodeId = this.normalizeText((data as any).taxonomy_group_node_id);
    const taxonomySubgroupNodeId = this.normalizeText((data as any).taxonomy_subgroup_node_id);
    const wantsTaxonomyNodeMapping = Boolean(taxonomyGroupNodeId || taxonomySubgroupNodeId);

    if (!isSingleSkillCreate || !wantsTaxonomyNodeMapping) {
      // Keep existing behavior for recursive tree creation or legacy payload.
      return this.createRecursive(data, null, data.unit_id ?? null);
    }

    const normalizedName = this.normalizeText(data.name);
    if (!normalizedName) {
      throw new HttpException('Skill name is required', HttpStatus.BAD_REQUEST);
    }

    if (!taxonomyGroupNodeId || !taxonomySubgroupNodeId) {
      throw new HttpException(
        'Taxonomy group node id and subgroup node id are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.skill.findFirst({
        where: {
          name: { equals: normalizedName, mode: 'insensitive' },
        },
        select: { id: true, name: true },
      });

      if (existing) {
        throw new HttpException(
          `Skill "${existing.name}" already exists`,
          HttpStatus.CONFLICT,
        );
      }

      const skill = await tx.skill.create({
        data: {
          name: normalizedName,
          description: data.description?.trim() || undefined,
          is_active: data.is_active ?? true,
          scope: 'GLOBAL',
          source: data.source?.trim() || ADMIN_TAXONOMY_NODE_SOURCE,
          is_verified: true,
        },
      });

      await this.replaceSkillAliasesCaseInsensitive(tx, skill.id, data.aliases);
      await this.replaceSkillTaxonomyNodeMapping(
        tx,
        skill.id,
        taxonomyGroupNodeId,
        taxonomySubgroupNodeId,
      );

      return tx.skill.findUnique({
        where: { id: skill.id },
        select: this.getSkillSelect(),
      }) as any;
    });
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
      taxonomy_subgroup_node_id,
      taxonomy_group_node_id,
      missing_taxonomy_node,
      include_inactive,
    } = params;

    const skip = (pages - 1) * items_per_pages;
    const scope = this.normalizeScope(rawScope);
    const searchText = this.normalizeText(search);
    const isTaxonomyAdminList =
      include_inactive === 'true' ||
      include_inactive === '1' ||
      Boolean(taxonomy_subgroup_node_id) ||
      Boolean(taxonomy_group_node_id) ||
      missing_taxonomy_node === 'true' ||
      missing_taxonomy_node === '1';

    const whereCondition: Prisma.SkillWhereInput = {};

    if (include_inactive !== 'true' && include_inactive !== '1') {
      whereCondition.is_active = true;
    }

    if (scope !== 'ALL') {
      whereCondition.scope = scope;
    }

    if (company_id) {
      whereCondition.company_id = company_id;
    }

    if (unit_id) {
      whereCondition.unit_id = unit_id;
    }

    if (taxonomy_subgroup_node_id) {
      whereCondition.taxonomyMappings = {
        some: { taxonomy_subgroup_node_id },
      };
    } else if (taxonomy_group_node_id) {
      whereCondition.taxonomyMappings = {
        some: { taxonomy_group_node_id },
      };
    } else if (
      missing_taxonomy_node === 'true' ||
      missing_taxonomy_node === '1'
    ) {
      whereCondition.taxonomyMappings = { none: {} };
    }

    if (searchText) {
      whereCondition.AND = [
        ...(Array.isArray(whereCondition.AND) ? whereCondition.AND : []),
        {
          OR: [
            { name: { contains: searchText, mode: 'insensitive' } },
            { description: { contains: searchText, mode: 'insensitive' } },
            {
              aliases: {
                some: { alias_text: { contains: searchText, mode: 'insensitive' } },
              },
            },
          ],
        },
      ];
    }

    const [data, total_items] = await Promise.all([
      isTaxonomyAdminList
        ? this.prisma.skill.findMany({
            where: whereCondition,
            skip,
            take: items_per_pages,
            select: this.getSkillSelect(),
            orderBy: { name: 'asc' },
          })
        : this.prisma.skill.findMany({
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
      data: data as any,
      current_pages: pages,
      items_per_pages,
      total_items,
    };
  }

  async getTaxonomyNodeSummary() {
    const [totalSkills, mappedSkillCount, missingSkillCount] = await Promise.all([
      this.prisma.skill.count(),
      this.prisma.skill.count({
        where: { taxonomyMappings: { some: {} } },
      }),
      this.prisma.skill.count({
        where: { taxonomyMappings: { none: {} } },
      }),
    ]);

    return {
      totalSkills,
      mappedSkillCount,
      missingSkillCount,
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

  async searchSkills(keyword?: string, limit = 20) {
    const searchText = keyword?.trim() || '';
    if (!searchText) return [];

    const take = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(30, Math.floor(Number(limit))))
      : 20;

    const skills = await this.prisma.skill.findMany({
      where: {
        is_active: true,
        scope: 'GLOBAL',
        OR: [
          { name: { contains: searchText, mode: 'insensitive' } },
          {
            aliases: {
              some: {
                alias_text: { contains: searchText, mode: 'insensitive' },
              },
            },
          },
        ],
      },
      take,
      orderBy: { name: 'asc' },
      select: this.getSkillSelect(),
    });

    return skills;
  }

  async getSkillsForPosition(positionId: string) {
    const position = await this.prisma.setting_Position_Posts.findUnique({
      where: { id: positionId },
      select: {
        id: true,
        name_post: true,
        group: { select: { id: true, name_group: true } },
      },
    });

    if (!position) {
      throw new HttpException('Position không tồn tại', HttpStatus.BAD_REQUEST);
    }

    const rows = await this.prisma.positionSkill.findMany({
      where: { position_id: positionId },
      select: {
        level: true,
        is_required: true,
        skill: {
          select: this.getSkillSelect(),
        },
      },
      orderBy: [{ is_required: 'desc' }, { skill: { name: 'asc' } }],
    });

    const skills = rows.map((row) => ({
      ...row.skill,
      level: row.level,
      is_required: row.is_required,
    }));

    return {
      position,
      skills,
    };
  }

  async addSkillToPosition(positionId: string, skillId?: string) {
    const normalizedSkillId = this.normalizeText(skillId);
    if (!normalizedSkillId) {
      throw new HttpException('skill_id is required', HttpStatus.BAD_REQUEST);
    }

    const [position, skill] = await Promise.all([
      this.prisma.setting_Position_Posts.findUnique({
        where: { id: positionId },
        select: { id: true },
      }),
      this.prisma.skill.findUnique({
        where: { id: normalizedSkillId },
        select: { id: true, is_active: true },
      }),
    ]);

    if (!position) {
      throw new HttpException('Position không tồn tại', HttpStatus.BAD_REQUEST);
    }

    if (!skill) {
      throw new HttpException('Skill không tồn tại', HttpStatus.BAD_REQUEST);
    }

    const created = await this.prisma.positionSkill.upsert({
      where: {
        position_id_skill_id: {
          position_id: positionId,
          skill_id: normalizedSkillId,
        },
      },
      create: {
        position_id: positionId,
        skill_id: normalizedSkillId,
        is_required: true,
      },
      update: {
        is_required: true,
      },
    });

    const mappingCount = await this.prisma.skillTaxonomyMapping.count({
      where: { skill_id: normalizedSkillId },
    });

    return {
      position_id: created.position_id,
      skill_id: created.skill_id,
      warning: mappingCount === 0 ? 'This skill has no taxonomy mapping' : null,
    };
  }

  async removeSkillFromPosition(positionId: string, skillId: string) {
    const result = await this.prisma.positionSkill.deleteMany({
      where: {
        position_id: positionId,
        skill_id: skillId,
      },
    });

    const remainingCount = await this.prisma.positionSkill.count({
      where: { skill_id: skillId },
    });

    return {
      removed: result.count,
      warning: remainingCount === 0 ? 'Skill is no longer mapped to any positions' : null,
    };
  }

  async getPositionSkillTree(params: { search?: string }) {
    const search = this.normalizeText(params.search);

    const [groups, positions, positionSkills] = await Promise.all([
      this.prisma.position_Group.findMany({
        select: {
          id: true,
          name_group: true,
        },
        orderBy: { name_group: 'asc' },
      }),
      this.prisma.setting_Position_Posts.findMany({
        where: {
          is_active: true,
          ...(search
            ? {
                name_post: {
                  contains: search,
                  mode: 'insensitive',
                },
              }
            : {}),
        },
        select: {
          id: true,
          name_post: true,
          group_id: true,
          is_active: true,
        },
        orderBy: { name_post: 'asc' },
      }),
      this.prisma.positionSkill.findMany({
        select: {
          position_id: true,
          skill: {
            select: this.getSkillSelect(),
          },
        },
      }),
    ]);

    const skillsByPosition = new Map<string, any[]>();
    for (const row of positionSkills) {
      if (!skillsByPosition.has(row.position_id)) skillsByPosition.set(row.position_id, []);
      skillsByPosition.get(row.position_id)?.push(row.skill);
    }

    const positionsByGroup = new Map<string, any[]>();
    for (const pos of positions) {
      const groupId = pos.group_id ?? 'UNGROUPED';
      if (!positionsByGroup.has(groupId)) positionsByGroup.set(groupId, []);
      positionsByGroup.get(groupId)?.push({
        id: pos.id,
        name: pos.name_post,
        is_active: pos.is_active,
        skills: skillsByPosition.get(pos.id) ?? [],
      });
    }

    const tree = groups.map((group) => ({
      id: group.id,
      name: group.name_group,
      positions: positionsByGroup.get(group.id) ?? [],
    }));

    const ungrouped = positionsByGroup.get('UNGROUPED') ?? [];
    if (ungrouped.length) {
      tree.unshift({
        id: null,
        name: 'Ungrouped',
        positions: ungrouped,
      } as any);
    }

    return {
      groups: tree,
    };
  }

  async getById(id: string, actor?: any): Promise<Skill | null> {
    return this.prisma.skill.findFirst({
      where: { id },
      include: {
        children: true,
        parent: true,
        aliases: true,
        taxonomyMappings: true,
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

  async getTaxonomyOptions() {
    const rows = await this.prisma.skillTaxonomyMapping.findMany({
      select: {
        taxonomy_group: true,
        taxonomy_subgroup: true,
      },
      distinct: ['taxonomy_group', 'taxonomy_subgroup'],
      orderBy: [
        { taxonomy_group: 'asc' },
        { taxonomy_subgroup: 'asc' },
      ],
    });

    const groups = new Set<string>();
    const subgroups = new Set<string>();
    const subgroupsByGroup = new Map<string, Set<string>>();

    for (const row of rows) {
      const group = this.normalizeText(row.taxonomy_group);
      const subgroup = this.normalizeText(row.taxonomy_subgroup);

      if (!group) continue;

      groups.add(group);

      if (!subgroupsByGroup.has(group)) {
        subgroupsByGroup.set(group, new Set<string>());
      }

      if (subgroup) {
        subgroups.add(subgroup);
        subgroupsByGroup.get(group)?.add(subgroup);
      }
    }

    return {
      groups: Array.from(groups).sort((a, b) => a.localeCompare(b)),
      subgroups: Array.from(subgroups).sort((a, b) => a.localeCompare(b)),
      subgroupsByGroup: Object.fromEntries(
        Array.from(subgroupsByGroup.entries()).map(([group, values]) => [
          group,
          Array.from(values).sort((a, b) => a.localeCompare(b)),
        ]),
      ),
    };
  }

  async getTaxonomyNodeOptions() {
    const groups = await this.prisma.skillTaxonomyNode.findMany({
      where: {
        node_type: 'GROUP',
        parent_id: null,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        normalized_key: true,
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    const subgroups = await this.prisma.skillTaxonomyNode.findMany({
      where: {
        node_type: 'SUBGROUP',
        parent_id: { not: null },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        parent_id: true,
        normalized_key: true,
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });

    const subgroupsByGroup: Record<string, { id: string; name: string }[]> = {};
    for (const subgroup of subgroups) {
      if (!subgroup.parent_id) continue;
      if (!subgroupsByGroup[subgroup.parent_id]) subgroupsByGroup[subgroup.parent_id] = [];
      subgroupsByGroup[subgroup.parent_id].push({ id: subgroup.id, name: subgroup.name });
    }

    return {
      groups: groups.map((g) => ({ id: g.id, name: g.name })),
      subgroups: subgroups.map((sg) => ({ id: sg.id, name: sg.name, group_id: sg.parent_id })),
      subgroupsByGroup,
    };
  }

  async getTaxonomyNodeTree(params: { search?: string; missing_only?: boolean }) {
    const search = this.normalizeText(params.search);
    const where: Prisma.SkillWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          aliases: {
            some: { alias_text: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    if (params.missing_only) {
      // Missing taxonomy node FK (even if text mapping exists)
      where.taxonomyMappings = {
        none: {},
      };
    }

    const skills = await this.prisma.skill.findMany({
      where,
      select: this.getSkillSelect(),
      orderBy: { name: 'asc' },
    });

    const groupMap = new Map<string, any>();
    const missingGroupKey = 'MISSING';
    let mappedSkillCount = 0;
    let missingSkillCount = 0;

    for (const skill of skills) {
      const aliases = skill.aliases.map((a) => a.alias_text);
      const primary = skill.taxonomyMappings[0] ?? null;

      if (skill.taxonomyMappings.length) mappedSkillCount += 1;
      else missingSkillCount += 1;

      const mapping = skill.taxonomyMappings[0];

      if (
        mapping?.taxonomy_group_node_id &&
        mapping?.taxonomy_subgroup_node_id
      ) {
        const groupId = mapping.taxonomy_group_node_id;
        const subgroupId = mapping.taxonomy_subgroup_node_id;
        const groupName = this.normalizeText(mapping.taxonomy_group);
        const subgroupName = this.normalizeText(mapping.taxonomy_subgroup);

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            id: groupId,
            name: groupName,
            skillCount: 0,
            subgroups: new Map<string, any>(),
          });
        }

        const group = groupMap.get(groupId);
        if (!group.subgroups.has(subgroupId)) {
          group.subgroups.set(subgroupId, {
            id: subgroupId,
            name: subgroupName || 'Unmapped',
            skillCount: 0,
            skills: [],
          });
        }

        const subgroup = group.subgroups.get(subgroupId);
        subgroup.skills.push({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          parent_id: skill.parent_id,
          is_active: skill.is_active,
          scope: skill.scope,
          source: skill.source,
          aliases,
          taxonomy_group: primary?.taxonomy_group ?? null,
          taxonomy_subgroup: primary?.taxonomy_subgroup ?? null,
          taxonomy_group_node_id: mapping.taxonomy_group_node_id,
          taxonomy_subgroup_node_id: mapping.taxonomy_subgroup_node_id,
          taxonomyMappings: skill.taxonomyMappings,
          created_at: skill.created_at,
          updated_at: skill.updated_at,
        });
        subgroup.skillCount += 1;
        group.skillCount += 1;
        continue;
      }

      // Missing node mapping
      if (!groupMap.has(missingGroupKey)) {
        groupMap.set(missingGroupKey, {
          id: null,
          name: 'Missing taxonomy',
          skillCount: 0,
          subgroups: new Map<string, any>(),
        });
      }
      const group = groupMap.get(missingGroupKey);
      const subgroupId = 'UNMAPPED';
      if (!group.subgroups.has(subgroupId)) {
        group.subgroups.set(subgroupId, {
          id: null,
          name: 'Unmapped',
          skillCount: 0,
          skills: [],
        });
      }
      const subgroup = group.subgroups.get(subgroupId);
      subgroup.skills.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        parent_id: skill.parent_id,
        is_active: skill.is_active,
        scope: skill.scope,
        source: skill.source,
        aliases,
        taxonomy_group: primary?.taxonomy_group ?? null,
        taxonomy_subgroup: primary?.taxonomy_subgroup ?? null,
        taxonomy_group_node_id: mapping?.taxonomy_group_node_id ?? null,
        taxonomy_subgroup_node_id: mapping?.taxonomy_subgroup_node_id ?? null,
        taxonomyMappings: skill.taxonomyMappings,
        created_at: skill.created_at,
        updated_at: skill.updated_at,
      });
      subgroup.skillCount += 1;
      group.skillCount += 1;
    }

    const groups = Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        subgroups: Array.from(group.subgroups.values()).sort((a: any, b: any) =>
          a.name.localeCompare(b.name),
        ),
      }))
      .sort((a, b) => {
        if (a.name === 'Missing taxonomy') return -1;
        if (b.name === 'Missing taxonomy') return 1;
        return a.name.localeCompare(b.name);
      });

    if (params.missing_only) {
      const missing = groups.filter((g) => g.name === 'Missing taxonomy');
      const mappedSkills = mappedSkillCount - missingSkillCount;
      return {
        totalSkills: missingSkillCount,
        mappedSkillCount: 0,
        missingSkillCount,
        groups: missing,
        // preserve counts for UI
        totalSkillsAll: skills.length,
        mappedSkillCountAll: mappedSkills,
      };
    }

    return {
      totalSkills: skills.length,
      mappedSkillCount,
      missingSkillCount,
      groups,
    };
  }

  private normalizeTaxonomyNodeKey(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  async getTaxonomyNodesCatalog() {
    const groups = await this.prisma.skillTaxonomyNode.findMany({
      where: {
        node_type: 'GROUP',
        parent_id: null,
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        },
      },
    });

    const subgroupIds = groups.flatMap((g) => g.children.map((c) => c.id));
    const skillCountRows =
      subgroupIds.length > 0
        ? await this.prisma.skillTaxonomyMapping.groupBy({
            by: ['taxonomy_subgroup_node_id'],
            where: {
              taxonomy_subgroup_node_id: { in: subgroupIds },
            },
            _count: { skill_id: true },
          })
        : [];

    const skillCountBySubgroup = new Map(
      skillCountRows.map((row) => [
        row.taxonomy_subgroup_node_id,
        row._count.skill_id,
      ]),
    );

    return {
      groups: groups.map((group) => {
        const subgroups = group.children.map((subgroup) => ({
          id: subgroup.id,
          name: subgroup.name,
          parent_id: subgroup.parent_id,
          node_type: subgroup.node_type,
          is_active: subgroup.is_active,
          sort_order: subgroup.sort_order,
          description: subgroup.description,
          skillCount: skillCountBySubgroup.get(subgroup.id) ?? 0,
        }));

        return {
          id: group.id,
          name: group.name,
          parent_id: group.parent_id,
          node_type: group.node_type,
          is_active: group.is_active,
          sort_order: group.sort_order,
          description: group.description,
          skillCount: subgroups.reduce((sum, sg) => sum + sg.skillCount, 0),
          subgroups,
        };
      }),
    };
  }

  async createTaxonomyNode(body: CreateTaxonomyNodeDto) {
    const name = this.normalizeText(body.name);
    if (!name) {
      throw new HttpException('Node name is required', HttpStatus.BAD_REQUEST);
    }

    const nodeType = body.node_type;
    if (nodeType !== 'GROUP' && nodeType !== 'SUBGROUP') {
      throw new HttpException('Invalid node_type', HttpStatus.BAD_REQUEST);
    }

    if (nodeType === 'GROUP') {
      if (body.parent_id) {
        throw new HttpException(
          'Group node cannot have parent_id',
          HttpStatus.BAD_REQUEST,
        );
      }

      const normalizedKey = this.normalizeTaxonomyNodeKey(name);
      const existing = await this.prisma.skillTaxonomyNode.findFirst({
        where: {
          parent_id: null,
          normalized_key: normalizedKey,
          node_type: 'GROUP',
        },
      });

      if (existing) {
        throw new HttpException(
          'Taxonomy group already exists',
          HttpStatus.CONFLICT,
        );
      }

      return this.prisma.skillTaxonomyNode.create({
        data: {
          name,
          normalized_key: normalizedKey,
          parent_id: null,
          level: 0,
          node_type: 'GROUP',
          description: this.normalizeText(body.description) || null,
          sort_order: Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0,
          is_active: true,
        },
      });
    }

    const parentId = body.parent_id?.trim();
    if (!parentId) {
      throw new HttpException(
        'parent_id is required for subgroup node',
        HttpStatus.BAD_REQUEST,
      );
    }

    const parent = await this.prisma.skillTaxonomyNode.findUnique({
      where: { id: parentId },
      select: { id: true, node_type: true, parent_id: true, is_active: true },
    });

    if (
      !parent ||
      parent.node_type !== 'GROUP' ||
      parent.parent_id ||
      !parent.is_active
    ) {
      throw new HttpException('Invalid parent group node', HttpStatus.BAD_REQUEST);
    }

    const normalizedKey = this.normalizeTaxonomyNodeKey(name);
    const existing = await this.prisma.skillTaxonomyNode.findFirst({
      where: {
        parent_id: parent.id,
        normalized_key: normalizedKey,
        node_type: 'SUBGROUP',
      },
    });

    if (existing) {
      throw new HttpException(
        'Taxonomy subgroup already exists in this group',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.skillTaxonomyNode.create({
      data: {
        name,
        normalized_key: normalizedKey,
        parent_id: parent.id,
        level: 1,
        node_type: 'SUBGROUP',
        description: this.normalizeText(body.description) || null,
        sort_order: Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0,
        is_active: true,
      },
    });
  }

  async updateTaxonomyNode(id: string, body: UpdateTaxonomyNodeDto) {
    const node = await this.prisma.skillTaxonomyNode.findUnique({
      where: { id },
    });

    if (!node) {
      throw new HttpException('Taxonomy node not found', HttpStatus.NOT_FOUND);
    }

    const nextName =
      body.name !== undefined ? this.normalizeText(body.name) : node.name;

    if (!nextName) {
      throw new HttpException('Node name cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const normalizedKey = this.normalizeTaxonomyNodeKey(nextName);

    const duplicate = await this.prisma.skillTaxonomyNode.findFirst({
      where: {
        id: { not: id },
        parent_id: node.parent_id,
        normalized_key: normalizedKey,
        node_type: node.node_type,
      },
    });

    if (duplicate) {
      throw new HttpException(
        'Another taxonomy node with the same name already exists',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.skillTaxonomyNode.update({
        where: { id },
        data: {
          name: nextName,
          normalized_key: normalizedKey,
          description:
            body.description !== undefined
              ? this.normalizeText(body.description) || null
              : undefined,
          sort_order:
            body.sort_order !== undefined && Number.isFinite(body.sort_order)
              ? Number(body.sort_order)
              : undefined,
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
        },
      });

      if (nextName !== node.name) {
        if (row.node_type === 'GROUP') {
          await tx.skillTaxonomyMapping.updateMany({
            where: { taxonomy_group_node_id: id },
            data: { taxonomy_group: nextName, updated_at: new Date() },
          });
        } else {
          await tx.skillTaxonomyMapping.updateMany({
            where: { taxonomy_subgroup_node_id: id },
            data: { taxonomy_subgroup: nextName, updated_at: new Date() },
          });
        }
      }

      return row;
    });

    return updated;
  }

  async softDeleteTaxonomyNode(id: string) {
    const node = await this.prisma.skillTaxonomyNode.findUnique({
      where: { id },
      include: {
        children: { where: { is_active: true }, select: { id: true } },
      },
    });

    if (!node) {
      throw new HttpException('Taxonomy node not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.$transaction(async (tx) => {
      if (node.node_type === 'GROUP') {
        await tx.skillTaxonomyNode.updateMany({
          where: { parent_id: node.id, is_active: true },
          data: { is_active: false, updated_at: new Date() },
        });
      }

      return tx.skillTaxonomyNode.update({
        where: { id },
        data: { is_active: false, updated_at: new Date() },
      });
    });
  }

  async getTaxonomyTree(params: { search?: string; missing_only?: boolean }) {
    const search = this.normalizeText(params.search);
    const where: Prisma.SkillWhereInput = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          aliases: {
            some: {
              alias_text: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    if (params.missing_only) {
      where.taxonomyMappings = {
        none: {},
      };
    }

    const skills = await this.prisma.skill.findMany({
      where,
      select: this.getSkillSelect(),
      orderBy: {
        name: 'asc',
      },
    });

    const groups = new Map<string, any>();
    let mappedSkillCount = 0;
    let missingSkillCount = 0;

    for (const skill of skills) {
      const aliases = skill.aliases.map((alias) => alias.alias_text);
      const mappings = skill.taxonomyMappings.length
        ? skill.taxonomyMappings
        : [
            {
              id: null,
              taxonomy_group: 'Missing taxonomy',
              taxonomy_subgroup: 'Unmapped',
              source: null,
            },
          ];

      if (skill.taxonomyMappings.length) mappedSkillCount += 1;
      else missingSkillCount += 1;

      for (const mapping of mappings) {
        const groupName =
          this.normalizeText(mapping.taxonomy_group) || 'Missing taxonomy';
        const subgroupName =
          this.normalizeText(mapping.taxonomy_subgroup) || 'Unmapped';

        if (!groups.has(groupName)) {
          groups.set(groupName, {
            name: groupName,
            skillCount: 0,
            subgroups: new Map<string, any>(),
          });
        }

        const group = groups.get(groupName);

        if (!group.subgroups.has(subgroupName)) {
          group.subgroups.set(subgroupName, {
            name: subgroupName,
            skillCount: 0,
            skills: [],
          });
        }

        const subgroup = group.subgroups.get(subgroupName);
        const primaryMapping = skill.taxonomyMappings[0] ?? null;

        subgroup.skills.push({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          parent_id: skill.parent_id,
          is_active: skill.is_active,
          scope: skill.scope,
          source: skill.source,
          aliases,
          taxonomy_group: primaryMapping?.taxonomy_group ?? null,
          taxonomy_subgroup: primaryMapping?.taxonomy_subgroup ?? null,
          taxonomyMappings: skill.taxonomyMappings,
          created_at: skill.created_at,
          updated_at: skill.updated_at,
        });
        subgroup.skillCount += 1;
        group.skillCount += 1;
      }
    }

    const tree = Array.from(groups.values())
      .map((group) => ({
        ...group,
        subgroups: Array.from(group.subgroups.values()).sort((a: any, b: any) =>
          a.name.localeCompare(b.name),
        ),
      }))
      .sort((a, b) => {
        if (a.name === 'Missing taxonomy') return -1;
        if (b.name === 'Missing taxonomy') return 1;
        return a.name.localeCompare(b.name);
      });

    return {
      totalSkills: skills.length,
      mappedSkillCount,
      missingSkillCount,
      groups: tree,
    };
  }

  async saveTaxonomySkill(data: CreateSkillDto) {
    const normalizedName = this.normalizeText(data.name);
    if (!normalizedName) {
      throw new HttpException('Skill name is required', HttpStatus.BAD_REQUEST);
    }

    const useNodeMapping =
      typeof (data as any).taxonomy_group_node_id === 'string' ||
      typeof (data as any).taxonomy_subgroup_node_id === 'string';

    const taxonomyGroupNodeId = this.normalizeText(
      (data as any).taxonomy_group_node_id,
    );
    const taxonomySubgroupNodeId = this.normalizeText(
      (data as any).taxonomy_subgroup_node_id,
    );

    const { taxonomyGroup, taxonomySubgroup } = useNodeMapping
      ? { taxonomyGroup: '', taxonomySubgroup: '' }
      : this.normalizeTaxonomyInput(data);

    if (useNodeMapping) {
      if (!taxonomyGroupNodeId || !taxonomySubgroupNodeId) {
        throw new HttpException(
          'Taxonomy group node id and subgroup node id are required',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const aliases = this.normalizeAliases(data.aliases);

    return this.prisma.$transaction(async (tx) => {
      const existingSkills = await tx.skill.findMany({
        where: {
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      if (existingSkills.length > 1) {
        throw new HttpException(
          `Multiple skills match "${normalizedName}". Edit the exact skill instead.`,
          HttpStatus.CONFLICT,
        );
      }

      const skill = existingSkills[0]
        ? await tx.skill.update({
            where: {
              id: existingSkills[0].id,
            },
            data: {
              name: normalizedName,
              description: data.description?.trim() || null,
              is_active: data.is_active ?? true,
              scope: 'GLOBAL',
              source: data.source?.trim() || ADMIN_TAXONOMY_SOURCE,
              updated_at: new Date(),
            },
          })
        : await tx.skill.create({
            data: {
              name: normalizedName,
              description: data.description?.trim() || undefined,
              is_active: data.is_active ?? true,
              scope: 'GLOBAL',
              source: data.source?.trim() || ADMIN_TAXONOMY_SOURCE,
              is_verified: true,
            },
          });

      await this.replaceSkillAliases(tx, skill.id, aliases);
      if (useNodeMapping) {
        await this.replaceSkillTaxonomyNodeMapping(
          tx,
          skill.id,
          taxonomyGroupNodeId,
          taxonomySubgroupNodeId,
        );
      } else {
        await this.replaceSkillTaxonomyMapping(
          tx,
          skill.id,
          taxonomyGroup,
          taxonomySubgroup,
        );
      }

      return tx.skill.findUnique({
        where: {
          id: skill.id,
        },
        select: this.getSkillSelect(),
      });
    });
  }

  async updateTaxonomySkill(id: string, data: UpdateSkillDto) {
    const existing = await this.prisma.skill.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpException('Skill không tồn tại', HttpStatus.BAD_REQUEST);
    }

    const normalizedName = this.normalizeText(data.name);
    if (!normalizedName) {
      throw new HttpException('Skill name is required', HttpStatus.BAD_REQUEST);
    }

    const useNodeMapping =
      typeof (data as any).taxonomy_group_node_id === 'string' ||
      typeof (data as any).taxonomy_subgroup_node_id === 'string';

    const taxonomyGroupNodeId = this.normalizeText(
      (data as any).taxonomy_group_node_id,
    );
    const taxonomySubgroupNodeId = this.normalizeText(
      (data as any).taxonomy_subgroup_node_id,
    );

    const { taxonomyGroup, taxonomySubgroup } = useNodeMapping
      ? { taxonomyGroup: '', taxonomySubgroup: '' }
      : this.normalizeTaxonomyInput(data);

    if (useNodeMapping) {
      if (!taxonomyGroupNodeId || !taxonomySubgroupNodeId) {
        throw new HttpException(
          'Taxonomy group node id and subgroup node id are required',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const aliases = this.normalizeAliases(data.aliases);

    return this.prisma.$transaction(async (tx) => {
      const skill = await tx.skill.update({
        where: { id },
        data: {
          name: normalizedName,
          description: data.description?.trim() || null,
          is_active: data.is_active ?? true,
          scope: 'GLOBAL',
          source: data.source?.trim() || ADMIN_TAXONOMY_SOURCE,
          updated_at: new Date(),
        },
      });

      await this.replaceSkillAliases(tx, skill.id, aliases);
      if (useNodeMapping) {
        await this.replaceSkillTaxonomyNodeMapping(
          tx,
          skill.id,
          taxonomyGroupNodeId,
          taxonomySubgroupNodeId,
        );
      } else {
        await this.replaceSkillTaxonomyMapping(
          tx,
          skill.id,
          taxonomyGroup,
          taxonomySubgroup,
        );
      }

      return tx.skill.findUnique({
        where: {
          id: skill.id,
        },
        select: this.getSkillSelect(),
      });
    });
  }

  async update(id: string, data: UpdateSkillDto, actor?: any): Promise<Skill> {
    const companyId = this.getCompanyId(actor);
    const existing = await this.prisma.skill.findFirst({
      where: { id, ...(companyId ? { unit_id: companyId } : {}) },
      select: { id: true },
    });

    if (!existing) {
      throw new HttpException('Skill không tồn tại', HttpStatus.BAD_REQUEST);
    }

    const taxonomyGroupNodeId = this.normalizeText(
      (data as any).taxonomy_group_node_id,
    );
    const taxonomySubgroupNodeId = this.normalizeText(
      (data as any).taxonomy_subgroup_node_id,
    );
    const wantsTaxonomyNodeMapping = Boolean(taxonomyGroupNodeId || taxonomySubgroupNodeId);

    if (wantsTaxonomyNodeMapping && (!taxonomyGroupNodeId || !taxonomySubgroupNodeId)) {
      throw new HttpException(
        'Taxonomy group node id and subgroup node id are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const normalizedName =
        typeof data.name === 'string' ? this.normalizeText(data.name) : '';

      if (typeof data.name === 'string') {
        if (!normalizedName) {
          throw new HttpException('Skill name is required', HttpStatus.BAD_REQUEST);
        }

        const dup = await tx.skill.findFirst({
          where: {
            id: { not: id },
            name: { equals: normalizedName, mode: 'insensitive' },
          },
          select: { id: true, name: true },
        });

        if (dup) {
          throw new HttpException(
            `Skill "${dup.name}" already exists`,
            HttpStatus.CONFLICT,
          );
        }
      }

      const updated = await tx.skill.update({
        where: { id },
        data: {
          ...(typeof data.name === 'string' ? { name: normalizedName } : {}),
          ...(typeof data.description !== 'undefined'
            ? { description: data.description?.trim() || null }
            : {}),
          ...(typeof data.is_active === 'boolean' ? { is_active: data.is_active } : {}),
          updated_at: new Date(),
        },
      });

      if (typeof data.aliases !== 'undefined') {
        await this.replaceSkillAliasesCaseInsensitive(tx, id, data.aliases);
      }

      if (wantsTaxonomyNodeMapping) {
        await this.replaceSkillTaxonomyNodeMapping(
          tx,
          id,
          taxonomyGroupNodeId,
          taxonomySubgroupNodeId,
        );
      }

      return updated;
    });
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
