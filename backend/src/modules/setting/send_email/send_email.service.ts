import { Injectable, NotFoundException } from '@nestjs/common';
import { generateCode } from 'src/common/utils/generate-code.util';
import { PrismaService } from 'src/prisma.service';
import { SettingEmailOtherFilterType } from './dto/filter_type';
import { SettingEmailOtherPaginType } from './dto/pagin_type';
import { UpdateSettingEmailOtherDto } from './dto/update';
import { CreateSettingEmailOtherDto } from './dto/create';
@Injectable()
export class SendEmailService {
  constructor(private prismaService: PrismaService) {}

  private getCompanyId(actor?: any): string | null {
    return actor?.company_id ?? null;
  }

  // ================= CREATE =================
  async create(data: CreateSettingEmailOtherDto, actor?: any) {
    const companyId = this.getCompanyId(actor);
    const { sec_code, unit_id, ...rest } = data;
    const resolvedUnitId = unit_id || companyId || null;
    if (resolvedUnitId) {
      const unit = await this.prismaService.inforCompany.findUnique({
        where: { id: resolvedUnitId },
        select: { id: true },
      });

      if (!unit) {
        throw new NotFoundException('Unit not found');
      }
    }
    const lastEmail =
      await this.prismaService.settingEmail.findFirst({
        where: {
          sec_code: {
            not: null,
            startsWith: 'SE_',
          },
        },
        orderBy: { sec_code: 'desc' },
        select: { sec_code: true },
      });

    let nextNumber = 1;
    const last = lastEmail?.sec_code;

    if (last) {
      const match = last.match(/^SE_(\d+)$/);
      if (match) nextNumber = Number(match[1]) + 1;
    }

    const secCode = sec_code
      ? sec_code
      : generateCode('SE', nextNumber);

    return this.prismaService.settingEmail.create({
      data: {
        ...rest,
        sec_code: secCode,
        unit_id: resolvedUnitId,
      },
    });
  }

  async getAll(
    filter: SettingEmailOtherFilterType,
    actor?: any,
  ): Promise<SettingEmailOtherPaginType> {
    const items_per_pages = Number(filter.items_per_pages) || 10;
    const pages = Number(filter.pages) || 1;
    const search = filter.search ? filter.search.trim() : '';
    const companyId = this.getCompanyId(actor);
    const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

    const whereCondition = {
      is_active: true,
      ...(companyId ? { unit_id: companyId } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                sec_code: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                subject: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                body: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [emails, total_items] = await Promise.all([
      this.prismaService.settingEmail.findMany({
        take: items_per_pages,
        skip,
        where: whereCondition,
        orderBy: { created_at: 'desc' },
        include: {
          inforCompany: true,
        },
      }),
      this.prismaService.settingEmail.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: emails,
      current_pages: pages,
      items_per_pages,
      total_items,
    };
  }

  async getByID(id: string, actor?: any) {
    const companyId = this.getCompanyId(actor);
    const email = await this.prismaService.settingEmail.findFirst({
      where: { id, ...(companyId ? { unit_id: companyId } : {}) },
      include: { inforCompany: true },
    });

    if (!email) {
      throw new NotFoundException('Email setting not found');
    }

    return email;
  }

  async update(
    id: string,
    data: UpdateSettingEmailOtherDto,
    actor?: any,
  ) {
    const companyId = this.getCompanyId(actor);
    const email = await this.prismaService.settingEmail.findFirst({
      where: { id, ...(companyId ? { unit_id: companyId } : {}) },
      select: { id: true },
    });

    if (!email) {
      throw new NotFoundException('Email setting not found');
    }

    const resolvedUnitId = data.unit_id || companyId || undefined;

    if (resolvedUnitId) {
      const unit = await this.prismaService.inforCompany.findUnique({
        where: { id: resolvedUnitId },
        select: { id: true },
      });

      if (!unit) {
        throw new NotFoundException('Unit not found');
      }
    }

    return this.prismaService.settingEmail.update({
      where: { id },
      data: {
        ...data,
        unit_id: resolvedUnitId,
        updated_at: new Date(),
      },
    });
  }

  // ================= SOFT DELETE =================
  async delete(id: string, actor?: any) {
    const companyId = this.getCompanyId(actor);
    const email = await this.prismaService.settingEmail.findFirst({
      where: { id, ...(companyId ? { unit_id: companyId } : {}) },
      select: { id: true },
    });

    if (!email) {
      throw new NotFoundException('Email setting not found');
    }

    return this.prismaService.settingEmail.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }
}