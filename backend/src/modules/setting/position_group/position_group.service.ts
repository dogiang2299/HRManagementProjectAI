import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePositionGroupDTO } from './dto/create_position_group';
import { UpdatePositionGroupDTO } from './dto/update_position_group';
import { PositionGroupFilterType } from './dto/filter_type';
import { PositionGroupPaginType } from './dto/pagin_type';
import { Prisma, Position_Group } from '@prisma/client';

@Injectable()
export class PositionGroupService {
  constructor(private prismaService: PrismaService) {}

  private getCompanyId(actor?: any): string | null {
    return actor?.company_id ?? null;
  }

  async create(data: CreatePositionGroupDTO, actor?: any): Promise<Position_Group> {
    const companyId = this.getCompanyId(actor);
    try {
      return await this.prismaService.position_Group.create({
        data: {
          ...data,
          ...(companyId && !data.unit_id ? { unit_id: companyId } : {}),
        },
        include: {
          inforCompany: {
            select: {
              id: true,
              full_name: true,
              acronym_name: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'Slug hoặc tên nhóm vị trí đã tồn tại',
            HttpStatus.CONFLICT,
          );
        }
      }
      throw error;
    }
  }

  async getAll(filter: PositionGroupFilterType, actor?: any): Promise<PositionGroupPaginType> {
    const items_per_pages = Number(filter.items_per_pages) || 10;
    const pages = Number(filter.pages) || 1;
    const search = filter.search?.trim() || '';

    const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

    const whereCondition: Prisma.Position_GroupWhereInput = {
      OR: [
        { name_group: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    };

    const [groups, total_items] = await Promise.all([
      this.prismaService.position_Group.findMany({
        take: items_per_pages,
        skip,
        where: whereCondition,
        include: {
          inforCompany: {
            select: {
              id: true,
              full_name: true,
              acronym_name: true,
            },
          },
          positions: {
            select: {
              id: true,
              name_post: true,
              position_code: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prismaService.position_Group.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: groups,
      current_pages: pages,
      total_items,
      items_per_pages,
    };
  }

  async getByID(id: string, actor?: any): Promise<Position_Group | null> {
    return this.prismaService.position_Group.findFirst({
      where: { id },
      include: {
        inforCompany: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
          },
        },
        positions: {
          select: {
            id: true,
            name_post: true,
            position_code: true,
            is_active: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdatePositionGroupDTO, actor?: any): Promise<Position_Group> {
    const companyId = this.getCompanyId(actor);
    const group = await this.prismaService.position_Group.findFirst({
      where: {
        id,
        ...(companyId ? { unit_id: companyId } : {}),
      },
      select: { id: true },
    });

    if (!group) {
      throw new HttpException(
        'Nhóm vị trí không tìm thấy',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      return await this.prismaService.position_Group.update({
        where: { id },
        data: {
          ...data,
          ...(companyId && !data.unit_id ? { unit_id: companyId } : {}),
        },
        include: {
          inforCompany: {
            select: {
              id: true,
              full_name: true,
              acronym_name: true,
            },
          },
          positions: {
            select: {
              id: true,
              name_post: true,
              position_code: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            'Slug hoặc tên nhóm vị trí đã tồn tại',
            HttpStatus.CONFLICT,
          );
        }
      }
      throw error;
    }
  }

  async delete(id: string, actor?: any): Promise<Position_Group> {
    const companyId = this.getCompanyId(actor);
    const group = await this.prismaService.position_Group.findFirst({
      where: {
        id,
        ...(companyId ? { unit_id: companyId } : {}),
      },
      select: { id: true },
    });

    if (!group) {
      throw new HttpException(
        'Nhóm vị trí không tìm thấy',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prismaService.position_Group.delete({
      where: { id },
    });
  }
}
