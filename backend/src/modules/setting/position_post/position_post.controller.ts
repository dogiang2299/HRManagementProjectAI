import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { PositionPostService } from './position_post.service';
import { CreatePositionPostDTO } from './dto/create_post';
import { Setting_Position_Posts } from '@prisma/client';
import { PostFilterType } from './dto/filter_type';
import { PostPaginType } from './dto/pagin_type';
import { UpdatePostDTO } from './dto/update_post';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('position-post')
export class PositionPostController {
    constructor(private positPost: PositionPostService){}
    @Post()
    create(@Body() body: CreatePositionPostDTO, @Req() req: any): Promise<Setting_Position_Posts>{
        const actor = extractActorFromRequest(req);
        return this.positPost.create(body, actor as any);
    }

    @Get()
    getAll(@Query() params: PostFilterType, @Req() req: any): Promise<PostPaginType>{
        const actor = extractActorFromRequest(req);
        return this.positPost.getAll(params, actor as any);
    }

    @Get(':id')
    getByID(@Param('id') id: string, @Req() req: any): Promise<Setting_Position_Posts | null>{
        const actor = extractActorFromRequest(req);
        return this.positPost.getByID(id, actor as any);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: UpdatePostDTO, @Req() req: any): Promise<Setting_Position_Posts | null>{
        const actor = extractActorFromRequest(req);
        return this.positPost.update(id, body, actor as any)
    }
    @Delete(':id')
    delete (@Param('id') id: string, @Req() req: any): Promise<Setting_Position_Posts>{
        const actor = extractActorFromRequest(req);
        return this.positPost.delete(id, actor as any);
    }
}
