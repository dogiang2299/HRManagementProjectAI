import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { Prisma } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma.service';
import { CreateEmployeeDTO } from './dto/created_employee';
import { hash } from 'bcrypt';
import { EmployeeFilterType } from './dto/employee_filter_type';
import { EmployeePaginType } from './dto/employee_pagin_type';
import { UpdatedEmployeeDTO } from './dto/updated_employee';
import { generateCode } from 'src/common/utils/generate-code.util';

@Injectable()
export class EmployeeService {
    constructor(private prismaService: PrismaService) {}

private getActorRoles(actor?: any): string[] {
  if (!actor) return [];
  if (Array.isArray(actor.roles)) {
    return actor.roles.filter((r: unknown) => typeof r === 'string') as string[];
  }
  if (typeof actor.actorRole === 'string') {
    return [actor.actorRole];
  }
  return [];
}

private getEmployerCompanyId(actor?: any): string | null {
  const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
  const isEmployer = roles.includes('employer');
  if (!isEmployer) return null;

  if (!actor?.company_id) {
    throw new ForbiddenException('No company_id for employer');
  }

  return actor.company_id;
}
async createEmployee(body: CreateEmployeeDTO): Promise<Employee> {
  const { emp_code, role_ids, roles_id, gender, ...rest } = body;

  const email = body.email_account.trim().toLowerCase();
  const phone = body.phone_account.trim();

  const existingByEmail = await this.prismaService.employee.findUnique({
    where: { email_account: email },
    select: { id: true },
  });
  if (existingByEmail) {
    throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
  }

  const existingByPhone = await this.prismaService.employee.findUnique({
    where: { phone_account: phone },
    select: { id: true },
  });
  if (existingByPhone) {
    throw new HttpException('Phone number already exists', HttpStatus.BAD_REQUEST);
  }

  const consultEmpRole = await this.prismaService.role.findFirst({
    where: {
      name_role: 'Employee',
      is_active: true,
      status: { not: 'Inactive' },
    },
    select: { id: true },
  });
  if (!consultEmpRole) {
    throw new HttpException('Role Employee is not found or Inactive', HttpStatus.BAD_REQUEST);
  }

  const lastEmp = await this.prismaService.employee.findFirst({
    where: { emp_code: { not: null, startsWith: 'EC_' } },
    orderBy: { emp_code: 'desc' },
    select: { emp_code: true },
  });

  let nextNumber = 1;
  const last = lastEmp?.emp_code;
  if (last) {
    const m = last.match(/^EC_(\d+)$/);
    if (m) nextNumber = Number(m[1]) + 1;
  }

  const empCode = generateCode('EC', nextNumber);
  const passwordHash = await hash(body.password, 10);

  const result = await this.prismaService.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        ...rest,
        emp_code: empCode,
        email_account: email,   // ✅ string
        phone_account: phone,   // ✅ string
        password: passwordHash,
        date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : undefined,
        // ✅ convert empty string to null for optional enum fields
        gender: gender && gender.trim() ? gender : null,
      },
    });

    const roleIdsToAssign =
      Array.isArray(role_ids) && role_ids.length
        ? role_ids
        : Array.isArray(roles_id) && roles_id.length
          ? roles_id
          : [consultEmpRole.id];

    await tx.employeeRole.createMany({
      data: roleIdsToAssign.map((rid) => ({
        id_employee: employee.id,
        id_role: rid,
      })),
      skipDuplicates: true,
    });

    return employee;
  });

  return result;
}

    async getAll(filter: EmployeeFilterType, actor?: any): Promise<EmployeePaginType> {
        const items_per_page = Number(filter.items_per_pages) || 10;
        const page = Number(filter.page) || 1;
        const search = filter.search ? filter.search.trim() : '';
      const companyId = this.getEmployerCompanyId(actor);

        const skip = page > 1 ? (page - 1) * items_per_page : 0;
      const whereCondition: any = {
        ...(companyId ? { company_id: companyId } : {}),
        OR: [
        { emp_code: { contains: search, mode: 'insensitive' } },
        { email_account: { contains: search, mode: 'insensitive' } },
        { phone_account: { contains: search, mode: 'insensitive' } },
        { employee_name: { contains: search, mode: 'insensitive' } },
        ],
        AND: [{ status: { not: 'Inactive' } }],
        // Exclude any employee who has the 'Candidate' role
        roles: { none: { role: { name_role: 'Candidate' } } },
      };

        const employee = await this.prismaService.employee.findMany({
            take: items_per_page,
            skip,
        where: whereCondition,
            orderBy: {
                created_at: 'desc'
            },
            include: {
              company: true,
                roles: {
                    include: {
                        role: true
                    }
                }
            }
        })
        const total_items = await this.prismaService.employee.count({
                        where: {
                  ...whereCondition,
                            is_active: true,
                },
            
        })
        return {
            data: employee,
            total_items,
            current_page: page,
            items_per_page 
        }
    }
    async getByID(id: string, actor?: any): Promise<Employee | null> {
      const companyId = this.getEmployerCompanyId(actor);
        return this.prismaService.employee.findFirst({
            where: {
          id,
          ...(companyId ? { company_id: companyId } : {}),
            },
            include: {
              company: true,
                roles: {
                    include: {
                        role: true
                    }
                }
            }
        })
    }
async updateEmployee(id: string, data: UpdatedEmployeeDTO): Promise<Employee> {
  const employee = await this.prismaService.employee.findUnique({
    where: { id },
    select: { id: true, is_active: true, status: true },
  });
  if (!employee) throw new HttpException('This employee is not found', HttpStatus.BAD_REQUEST);

  const {
    role_ids,               // ✅ nếu FE gửi role_ids thì cũng bắt ra luôn để khỏi lọt vào update
    date_of_birth,
    gender,
    ...employeeData
  } = data as any;

  const changeStatus = employee.is_active === false && employee.status === 'Inactive';

  const dataUpdate: any = {
    ...employeeData,

    // ✅ convert date
    date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
    
    // ✅ convert empty string to null for optional enum fields
    gender: gender && gender.trim() ? gender : null,
  };

  if (changeStatus) {
    dataUpdate.is_active = true;
    dataUpdate.status = 'Active';
  }

  // ✅ nếu m dùng roles_id để update bảng employeeRole
  const rolesToSet =  role_ids;

  if (rolesToSet?.length) {
    const roles = await this.prismaService.role.findMany({
      where: {
        id: { in: rolesToSet },
        is_active: true,
        status: { not: 'Inactive' },
      },
      select: { id: true },
    });
    if (roles.length !== rolesToSet.length) {
      throw new HttpException('Some roles not found or Inactive', HttpStatus.BAD_REQUEST);
    }
  }

  const result = await this.prismaService.$transaction(async (tx) => {
    const updateEmp = await tx.employee.update({
      where: { id },
      data: dataUpdate,
    });

    if (rolesToSet) {
      await tx.employeeRole.deleteMany({ where: { id_employee: id } });

      if (rolesToSet.length) {
        await tx.employeeRole.createMany({
          data: rolesToSet.map((rid: string) => ({ id_employee: id, id_role: rid })),
          skipDuplicates: true,
        });
      }
    }

    return updateEmp;
  });

  return result;
}
    async deleteEmployee(id: string): Promise<Employee> {
        return await this.prismaService.employee.update({
            where: {id},
            data: {is_active: false, status: 'Inactive'}
        })
    }

    async updateEmployeeAvatar(id: string, avatarFilename: string): Promise<Employee> {
        return await this.prismaService.employee.update({
            where: { id },
            data: { avatar: avatarFilename }
        });
    }
}

