import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateRoleDTO } from './dto/created_role';
import { Role } from '@prisma/client';
import { RoleService } from './role.service';
import { RoleFilterType } from './dto/role_filter_type';
import { RolePaginType } from './dto/role_pagin_type';
import { UpdateRoleDTO } from './dto/updated_role';

@Controller('role')
export class RoleController {
    constructor(private roleService: RoleService){}
    @Post()
    create(@Body() body: CreateRoleDTO): Promise<Role>{
        return this.roleService.create(body);
    }

    @Get()
    getAll(@Query() params: RoleFilterType): Promise<RolePaginType>{
        return this.roleService.getAll(params);
    }

    @Get(':id')
    getByID(@Param('id') id: string): Promise<Role | null>{
        return this.roleService.getByID(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: UpdateRoleDTO): Promise<Role | null>{
        return this.roleService.update(id, body);
    }

    @Delete(':id')
    delete (@Param('id') id: string): Promise<Role>{
        return this.roleService.detele(id);
    }
}
