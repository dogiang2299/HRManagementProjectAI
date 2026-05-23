import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePositionPostDTO } from './dto/create_post';
import { generateCode } from 'src/common/utils/generate-code.util';
import { UpdatePostDTO } from './dto/update_post';
import { PostFilterType } from './dto/filter_type';
import { PostPaginType } from './dto/pagin_type';
import { Prisma, Setting_Position_Posts } from '@prisma/client';
import { POSITION_POST_STATUS } from 'src/constant';

@Injectable()
export class PositionPostService {
    constructor (private prismaService: PrismaService){}

    private getCompanyId(actor?: any): string | null {
        return actor?.company_id ?? null;
    }

    private async generateNextPositionCode(): Promise<string> {
        // Use code ordering (not created_at) so imports/manual edits don't break sequence.
        const lastPP = await this.prismaService.setting_Position_Posts.findFirst({
            where: { position_code: { not: null, startsWith: 'PP_' } },
            orderBy: { position_code: 'desc' },
            select: { position_code: true },
        });

        let nextNumber = 1;
        const last = lastPP?.position_code;
        if (last) {
            const m = last.match(/^PP_(\d+)$/);
            if (m) nextNumber = Number(m[1]) + 1;
        }

        return generateCode('PP', nextNumber);
    }

    async create (data: CreatePositionPostDTO, actor?: any){
        const companyId = this.getCompanyId(actor);
        const { Setting_Process_Recruitment_id, unit_id, position_code, ...rest } = data;
        const resolvedUnitId = unit_id || companyId || null;

        // Retry a few times to handle concurrent creates racing on the same generated code.
        for (let attempt = 0; attempt < 5; attempt++) {
            const ppCode = await this.generateNextPositionCode();
            try {
                return await this.prismaService.setting_Position_Posts.create({
                    data: {
                        ...rest,
                        position_code: ppCode,
                        ...(Setting_Process_Recruitment_id ? { processRecruitment: { connect: { id: Setting_Process_Recruitment_id } } } : {}),
                        ...(resolvedUnitId ? { inforCompany: { connect: { id: resolvedUnitId } } } : {}),
                    }
                });
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    continue;
                }
                throw error;
            }
        }

        throw new HttpException('Could not generate a unique position code. Please try again.', HttpStatus.CONFLICT);
    }
    async getAll (filter: PostFilterType, actor?: any): Promise<PostPaginType>{
        const items_per_pages = Number(filter.items_per_pages) || 10;
        const pages = Number(filter.pages) || 1;
        const search = filter.search ? filter.search.trim() : '';

        const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

        const where: Prisma.Setting_Position_PostsWhereInput = {
            is_active: true,
            OR: [
                { name_post: { contains: search, mode: 'insensitive' } },
                { position_code: { contains: search, mode: 'insensitive' } },
            ],
            AND: [
                { status: { not: POSITION_POST_STATUS.INACTIVE } },
            ],
        };

        const post = await this.prismaService.setting_Position_Posts.findMany({
            take: items_per_pages,
            skip,
            where,
            orderBy: {created_at: 'desc'}
        })
        const total_items = await this.prismaService.setting_Position_Posts.count({
            where
        })
        return {
            data: post,
            current_pages: pages,
            total_items,
            items_per_pages
        }
    }
    async getByID(id: string, actor?: any): Promise<Setting_Position_Posts | null>{
        return this.prismaService.setting_Position_Posts.findFirst({
            where: {id}
        })
    }

    async update (id: string, data: UpdatePostDTO, actor?: any): Promise<Setting_Position_Posts>{
        const companyId = this.getCompanyId(actor);
        const post = await this.prismaService.setting_Position_Posts.findFirst({
            where: {id, ...(companyId ? { unit_id: companyId } : {})},
            select: {is_active: true, id: true, status: true}
        })
        if(!post){
            throw new HttpException('This position post is not found', HttpStatus.BAD_REQUEST);
        }
        const dataUpdate = { ... data};
        if(typeof dataUpdate.status === 'string'){
            if(dataUpdate.status === POSITION_POST_STATUS.INACTIVE) dataUpdate.is_active = false;
            if(dataUpdate.status === POSITION_POST_STATUS.ACTIVE) dataUpdate.is_active = true
        }
        if(typeof dataUpdate.is_active === 'boolean'){
            dataUpdate.status = dataUpdate.is_active
                ? POSITION_POST_STATUS.ACTIVE
                : POSITION_POST_STATUS.INACTIVE;
        }
        return this.prismaService.setting_Position_Posts.update({
            where: {id},
            data: {
                ...dataUpdate,
                ...(companyId && !dataUpdate.unit_id ? { unit_id: companyId } : {}),
            }
        })
    }
    async delete (id: string, actor?: any): Promise<Setting_Position_Posts>{
        const companyId = this.getCompanyId(actor);
        const post = await this.prismaService.setting_Position_Posts.findFirst({
            where: { id, ...(companyId ? { unit_id: companyId } : {}) },
            select: { id: true },
        });

        if (!post) {
            throw new HttpException('This position post is not found', HttpStatus.BAD_REQUEST);
        }

        return this.prismaService.setting_Position_Posts.update({
            where: {id},
            data: { status: POSITION_POST_STATUS.INACTIVE, is_active: false }
        })
    }
}
