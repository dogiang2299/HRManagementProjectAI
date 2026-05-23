import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { RecinformService } from './recinform.service';
import { CreateRecruitmentInforDto } from './dto/created_recinform';
import { filter } from 'rxjs';
import { RecruitmentInforFilterType } from './dto/recinform_filter_type';
import { RecruitmentInforPaginType } from './dto/recinform_pagin_type';
import { UpdateRecruitmentInforDto } from './dto/updated_recinform';
import { RecruitmentCostQueryDto } from './dto/cost-query';
import { RecruitmentPlanQueryDto } from './dto/plan-query';
import { Recruitment_Infor } from '@prisma/client';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

    @Controller('recinform')
    export class RecinformController {
        constructor(private recInforService: RecinformService){}
        @Post()
        create (@Body() data: CreateRecruitmentInforDto, @Req() req: any){
            const actor = extractActorFromRequest(req);
            return this.recInforService.create(data, actor);
        }

    @Get()
    getAll (@Query() filter:RecruitmentInforFilterType, @Req() req: any): Promise<RecruitmentInforPaginType>{
        const actor = extractActorFromRequest(req);
        return this.recInforService.getAllWithRole(filter, actor);
    }

    @Get('cost/summary')
    getCostSummary(@Query() query: RecruitmentCostQueryDto, @Req() req: any) {
        const actor = extractActorFromRequest(req);
        return this.recInforService.getCostSummary(query, actor);
    }

    @Get('plan/summary')
    getPlanSummary(@Query() query: RecruitmentPlanQueryDto, @Req() req: any) {
        const actor = extractActorFromRequest(req);
        return this.recInforService.getPlanSummary(query, actor);
    }

    @Get(':id')
    getByID (
        @Param('id') id: string,
        @Query('source') source: string | undefined,
        @Req() req: any,
    ): Promise<any|null>{
        const actor = extractActorFromRequest(req);
        return this.recInforService.getByID(id, actor, source);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: UpdateRecruitmentInforDto, @Req() req: any): Promise<Recruitment_Infor | null>{
        const actor = extractActorFromRequest(req);
        return this.recInforService.update(id, body, actor);
    }

    @Delete(':id')
    delete(@Param('id') id:string):Promise<Recruitment_Infor>{
        return this.recInforService.delete(id);
    }

}
