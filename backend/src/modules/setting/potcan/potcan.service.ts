import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Setting_Potential_Type } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { PotentialFilterType } from './dto/filter_type';
import { PotentialPaginType } from './dto/pagin_type';
import { UpdatePotentialTypeDTO } from './dto/update_potcan';
import { generateCode } from 'src/common/utils/generate-code.util';
import { CreatePotentialTypeDTO } from './dto/create_potcan';

@Injectable()
export class PotcanService {
    constructor(private prismaService: PrismaService){}
    private getCompanyId(actor?: any): string | null {
        return actor?.company_id ?? null;
    }
   async create(data: CreatePotentialTypeDTO, actor?: any){
        const companyId = this.getCompanyId(actor);
        return this.prismaService.setting_Potential_Type.create({
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
                    }
                }
            }
        })
    }
    async getAll(filter: PotentialFilterType, actor?: any): Promise<PotentialPaginType>{
        const items_per_pages = Number(filter.items_per_pages) || 10;
        const pages = Number(filter.pages) || 1;
        const search = filter.search ? filter.search.trim() : '';

        const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

        const potential = await this.prismaService.setting_Potential_Type.findMany({
            take: items_per_pages,
            skip,
            where: {
                is_active: true,
                OR: [
                    {
                        name: { contains: search, mode: 'insensitive' }
                    },
                    {
                        description: { contains: search, mode: 'insensitive' }
                    }
                ]
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' },
            ],
            include: {
                inforCompany: {
                    select: {
                        id: true,
                        full_name: true,
                        acronym_name: true,
                    }
                }
            }
        })

        const total_items = await this.prismaService.setting_Potential_Type.count({
            where: {
                is_active: true,
                OR: [
                    {
                        name: { contains: search, mode: 'insensitive' }
                    },
                    {
                        description: { contains: search, mode: 'insensitive' }
                    }
                ]
            }
        })

        return {
            data: potential,
            current_pages: pages,
            items_per_pages,
            total_items
        }
    }

    async getByID(id: string, actor?: any): Promise<Setting_Potential_Type | null>{
        return this.prismaService.setting_Potential_Type.findFirst({
            where: { id },
            include: {
                inforCompany: {
                    select: {
                        id: true,
                        full_name: true,
                        acronym_name: true,
                    }
                }
            }
        })
    }

    async update(id: string, data: UpdatePotentialTypeDTO, actor?: any): Promise<Setting_Potential_Type>{
        const companyId = this.getCompanyId(actor);
        const potential = await this.prismaService.setting_Potential_Type.findFirst({
            where: { id, ...(companyId ? { unit_id: companyId } : {}) },
            select: { id: true }
        })

        if(!potential){
            throw new HttpException('This potential type is not found', HttpStatus.BAD_REQUEST)
        }

        return this.prismaService.setting_Potential_Type.update({
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
                    }
                }
            }
        })
    }

    async delete(id: string, actor?: any): Promise<Setting_Potential_Type>{
        const companyId = this.getCompanyId(actor);
        return this.prismaService.setting_Potential_Type.update({
            where: { id, ...(companyId ? { unit_id: companyId } : {}) },
            data: { is_active: false }
        })
    }
}
