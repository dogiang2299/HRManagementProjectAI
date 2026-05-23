import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Setting_Potential_Type } from '@prisma/client';
import { CreatePotentialTypeDTO } from './dto/create_potcan';
import { PotentialFilterType } from './dto/filter_type';
import { PotentialPaginType } from './dto/pagin_type';
import { UpdatePotentialTypeDTO } from './dto/update_potcan';
import { PotcanService } from './potcan.service';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('potcan')
export class PotcanController {
    constructor(private potentialService: PotcanService){}

    @Post()
    create(@Body() body: CreatePotentialTypeDTO, @Req() req: any): Promise<Setting_Potential_Type>{
        const actor = extractActorFromRequest(req);
        return this.potentialService.create(body, actor as any);
    }

    @Get()
    getAll(@Query() params: PotentialFilterType, @Req() req: any): Promise<PotentialPaginType>{
        const actor = extractActorFromRequest(req);
        return this.potentialService.getAll(params, actor as any);
    }

    @Get(':id')
    getByID(@Param('id') id:string, @Req() req: any): Promise<Setting_Potential_Type | null>{
        const actor = extractActorFromRequest(req);
        return this.potentialService.getByID(id, actor as any);
    }

    @Put(':id')
    update(
        @Param('id') id:string,
        @Body() body: UpdatePotentialTypeDTO,
        @Req() req: any,
    ): Promise<Setting_Potential_Type>{
        const actor = extractActorFromRequest(req);
        return this.potentialService.update(id, body, actor as any);
    }

    @Delete(':id')
    delete(@Param('id') id:string, @Req() req: any): Promise<Setting_Potential_Type>{
        const actor = extractActorFromRequest(req);
        return this.potentialService.delete(id, actor as any);
    }
}
