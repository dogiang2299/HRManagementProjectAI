import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateInforCompanyDTO } from './dto/created_inforcom';
import { InforCompany } from '@prisma/client';
import { InformCompanyFilterType } from './dto/inforcom_filter_type';
import { InformCompanyPaginType } from './dto/inforcom_pagin_type';
import { UpdateInforCompanyDTO } from './dto/updated_inforcom';
import { generateCode } from 'src/common/utils/generate-code.util';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class InforcompanyService {
    constructor(private prismaService: PrismaService){}

        private readonly fieldOfActivityInclude = {
            field_of_activity_group: {
                select: {
                    id: true,
                    name_group: true,
                    slug: true,
                },
            },
            employees: true,
        } as const;

    async createInfor(data: CreateInforCompanyDTO): Promise<InforCompany> {
    const { infor_code, date_stablish, date_of_issue, field_of_activity_id, ...rest } = data;

  const lastInfor = await this.prismaService.inforCompany.findFirst({
    where: {
      infor_code: { not: null, startsWith: 'IC_' },
    },
    orderBy: { infor_code: 'desc' },
    select: { infor_code: true },
  });

  let nextNumber = 1;
  const last = lastInfor?.infor_code;
  if (last) {
    const m = last.match(/^IC_(\d+)$/);
    if (m) nextNumber = Number(m[1]) + 1;
  }

  const inforCode = generateCode('IC', nextNumber);

  return this.prismaService.inforCompany.create({
    data: {
      ...rest,
      infor_code: inforCode,
            field_of_activity_id: field_of_activity_id || null,
      date_of_issue: date_of_issue ? new Date(date_of_issue) : undefined,
      date_stablish: date_stablish ? new Date(date_stablish) : undefined,
    },
        include: this.fieldOfActivityInclude,
  });
}

    async getAll(filter: InformCompanyFilterType): Promise<InformCompanyPaginType>{
        const item_per_page = Number(filter.items_per_page) || 10;
        const page = Number(filter.page) || 1;
        const search = filter.search ? filter.search.trim() : '';
        const status = filter.status?.trim();
        const sortBy = filter.sortBy?.trim();
        const sortOrder = filter.sortOrder === 'asc' ? 'asc' : 'desc';

        const allowedSortFields = new Set(['infor_code', 'full_name', 'created_at']);
        const orderField = allowedSortFields.has(sortBy ?? '') ? sortBy : 'created_at';
        const orderBy: any = {
            [orderField as string]: sortOrder,
        };

        const skip = page > 1 ? (page - 1) * item_per_page : 0;
        const where = {
            is_active: true,
            ...(status && { status }),
            OR: [
                {
                    full_name: { contains: search, mode: 'insensitive' as const}
                },
                {
                    acronym_name: { contains: search, mode: 'insensitive' as const}
                }
            ],
        };

        const company = await this.prismaService.inforCompany.findMany({
            take: item_per_page,
            skip,
            include: this.fieldOfActivityInclude,
            where,
            orderBy,
        })
        const total_items = await this.prismaService.inforCompany.count({
            where
        })
        return {
            data: company,
            total_items,
            current_page: page,
            item_per_page
        }
    } 
    async getByID(id: string): Promise<InforCompany| null>{
        return this.prismaService.inforCompany.findFirst({
            where: { id, is_active: true },
            include: this.fieldOfActivityInclude,
        })
    }

    async getCompanyField(id: string): Promise<InforCompany[]> {
        const currentCompany = await this.prismaService.inforCompany.findUnique({
            where: { id },
            select: {
                id: true,
                field_of_activity_id: true,
            },
        });

        // Support 2 cases:
        // 1) id is company id: return companies sharing same field_of_activity_id, excluding current company.
        // 2) id is field_of_activity_id: return all companies in that field.
        const targetFieldId = currentCompany?.field_of_activity_id ?? id;

        if (!targetFieldId) {
            return [];
        }

        return this.prismaService.inforCompany.findMany({
            where: {
                is_active: true,
                field_of_activity_id: targetFieldId,
                ...(currentCompany ? { id: { not: currentCompany.id } } : {}),
            },
            include: this.fieldOfActivityInclude,
            orderBy: { created_at: 'desc' },
            take: 12,
        });
    }

    async updateInform (id: string, data: UpdateInforCompanyDTO): Promise<InforCompany>{
        const { date_stablish, date_of_issue, field_of_activity_id, ...rest} = data;

        return await this.prismaService.inforCompany.update({
            where: {id},
            include: this.fieldOfActivityInclude,
            data: {
                ...rest,
                field_of_activity_id: field_of_activity_id || null,
                date_of_issue: date_of_issue ? new Date(date_of_issue) : undefined,
                date_stablish: date_stablish ? new Date(date_stablish) : undefined,
            }
        })
    }
    async deleteInform (id: string): Promise<InforCompany>{
        return await this.prismaService.inforCompany.update({
            where: {id},
            include: this.fieldOfActivityInclude,
            data: {is_active: false, status: 'Inactive'}
        })
    }

    async replaceLogo(id: string, newFileName: string, actor?: any): Promise<InforCompany> {
        const company = await this.prismaService.inforCompany.findUnique({
            where: { id },
            select: { id: true, image_logo: true },
        });

        if (!company) throw new NotFoundException('Company not found');

        // Delete old logo if exists
        if (company.image_logo) {
            const oldPath = path.join(process.cwd(), 'uploads', 'logo', company.image_logo);
            fs.promises.unlink(oldPath).catch(() => {});
        }

        const updated = await this.prismaService.inforCompany.update({
            where: { id },
            data: {
                image_logo: newFileName,
            },
            select: {
                id: true,
                image_logo: true,
            },
        });

        return updated as InforCompany;
    }
}
