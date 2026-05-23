import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateRoleDTO } from './dto/created_role';
import { Employee, Role } from '@prisma/client';
import { RoleFilterType } from './dto/role_filter_type';
import { RolePaginType } from './dto/role_pagin_type';
import { UpdateRoleDTO } from './dto/updated_role';
import { generateCode } from 'src/common/utils/generate-code.util';

@Injectable()
export class RoleService {
    constructor (private prismaService: PrismaService){}
    async create(data: CreateRoleDTO): Promise<Role> {
  const { role_code, ...rest } = data;

  const lastRole = await this.prismaService.role.findFirst({
    where: {
      role_code: { not: null, startsWith: 'RL_' },
    },
    orderBy: { role_code: 'desc' },
    select: { role_code: true },
  });

  let nextNumber = 1;
  const last = lastRole?.role_code;
  if (last) {
    const m = last.match(/^RL_(\d+)$/);
    if (m) nextNumber = Number(m[1]) + 1;
  }

  const roleCode = generateCode('RL', nextNumber);

  return this.prismaService.role.create({
    data: {
      ...rest,
      role_code: roleCode,
    },
  });
}

    async getAll (filter: RoleFilterType): Promise<RolePaginType>{
        const items_per_page = Number(filter.items_per_page) || 10;
        const page = Number(filter.page) || 1;
        const search = filter.search ? filter.search.trim() : '';

        const skip = page > 1 ? (page - 1) * items_per_page : 0;
        const role = await this.prismaService.role.findMany({
            take: items_per_page,
            skip,
            where: {
                OR: [
                    {
                        name_role: {contains: search, mode: 'insensitive'}
                    }
                ],
                AND: [
                    {
                        status: {not: 'Inactive' }
                    }
                ]

            },
            orderBy: {
                created_at: 'desc'
            }
        })
        const total_items = await this.prismaService.role.count({
            where: {
                is_active: true,
                OR:[
                    {
                        name_role: {contains: search, mode: 'insensitive'}
                    }
                ],
                AND: [
                    {
                        status: { not: 'Inactive'}
                    }
                ],
                
            }
        })
        return {
            data: role,
            current_page: page,
            total_items,
            items_per_page
        }
    }
    async getByID (id: string): Promise<Role | null>{
        return this.prismaService.role.findFirst({
            where: { id}
        })
    }
    async update(id: string, data: UpdateRoleDTO): Promise<Role> {
  const role = await this.prismaService.role.findUnique({
    where: { id },
    select: { id: true, is_active: true, status: true },
  });

  if (!role) {
    throw new HttpException('Role is not found', HttpStatus.BAD_REQUEST);
  }

  const dataUpdate: any = { ...data };

  if (typeof data.status === 'string') {
    if (data.status === 'Inactive') dataUpdate.is_active = false;
    if (data.status === 'Active') dataUpdate.is_active = true;
  }
  if (typeof data.is_active === 'boolean') {
    dataUpdate.status = data.is_active ? 'Active' : 'Inactive';
  }

  return this.prismaService.role.update({
    where: { id },
    data: dataUpdate,
  });
}

    async detele (id: string): Promise<Role>{
        return this.prismaService.role.update({
            where: {id},
            data: {is_active: false, status: 'Inactive'}
        })
    }
}
