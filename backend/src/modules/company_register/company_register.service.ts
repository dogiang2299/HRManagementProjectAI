import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCompanyRegistrationDto } from './dto/create';
import { CompanyRegistrationFilterType } from './dto/filter_type';
import { CompanyRegistrationPaginType } from './dto/pagin_type';
import { UpdateCompanyRegistrationDto } from './dto/update';
import { generateCode } from 'src/common/utils/generate-code.util';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';
@Injectable()
export class CompanyRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompanyRegistrationDto) {
    const contactName = (data.contactName?.trim() || data.companyName?.trim() || '').trim();
    const contactEmail = (data.contactEmail?.trim() || data.email?.trim() || '').toLowerCase();
    const contactPhone = (data.contactPhone?.trim() || data.phone?.trim() || '').trim();

    if (!contactName || !contactEmail || !contactPhone) {
      throw new HttpException(
        'contactName, contactEmail and contactPhone are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const companyName = data.companyName?.trim();
    if (!companyName) {
      throw new HttpException('companyName is required', HttpStatus.BAD_REQUEST);
    }

    const requestEmail = (data.email?.trim() || contactEmail).toLowerCase();
    const requestPhone = data.phone?.trim() || contactPhone;

    const existingByEmail = await this.prisma.employee.findUnique({
      where: { email_account: contactEmail },
      select: { id: true },
    });
    if (existingByEmail) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const existingByPhone = await this.prisma.employee.findUnique({
      where: { phone_account: contactPhone },
      select: { id: true },
    });
    if (existingByPhone) {
      throw new HttpException('Phone number already exists', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.$transaction(async (tx) => {
      const lastEmp = await tx.employee.findFirst({
        where: { emp_code: { not: null, startsWith: 'EC_' } },
        orderBy: { emp_code: 'desc' },
        select: { emp_code: true },
      });

      let nextEmpNumber = 1;
      const lastEmpCode = lastEmp?.emp_code;
      if (lastEmpCode) {
        const match = lastEmpCode.match(/^EC_(\d+)$/);
        if (match) nextEmpNumber = Number(match[1]) + 1;
      }

      let employerRole = await tx.role.findFirst({
        where: {
          name_role: { equals: 'Employer', mode: 'insensitive' },
          is_active: true,
          status: { not: 'Inactive' },
        },
        select: { id: true },
      });

      if (!employerRole) {
        const lastRole = await tx.role.findFirst({
          where: { role_code: { not: null, startsWith: 'RL_' } },
          orderBy: { role_code: 'desc' },
          select: { role_code: true },
        });

        let nextRoleNumber = 1;
        const lastRoleCode = lastRole?.role_code;
        if (lastRoleCode) {
          const match = lastRoleCode.match(/^RL_(\d+)$/);
          if (match) nextRoleNumber = Number(match[1]) + 1;
        }

        employerRole = await tx.role.create({
          data: {
            role_code: generateCode('RL', nextRoleNumber),
            name_role: 'Employer',
            is_active: true,
            status: 'Active',
          },
          select: { id: true },
        });
      }

      const temporaryPassword = randomBytes(8).toString('hex');
      const passwordHash = await hash(temporaryPassword, 10);

      const employee = await tx.employee.create({
        data: {
          emp_code: generateCode('EC', nextEmpNumber),
          employee_name: contactName,
          email: contactEmail,
          email_account: contactEmail,
          phone_account: contactPhone,
          password: passwordHash,
          status: 'Active',
          is_active: true,
        },
        select: { id: true },
      });

      await tx.employeeRole.create({
        data: {
          id_employee: employee.id,
          id_role: employerRole.id,
        },
      });

      return tx.companyRegistrationRequest.create({
        data: {
          companyName,
          email: requestEmail,
          phone: requestPhone,
          address: data.address?.trim() || null,
          website: data.website?.trim() || null,
          recruitmentNeeds: data.recruitmentNeeds?.trim() || null,
          source: data.source?.trim() || null,
          status: data.status || 'pending',
          createdById: employee.id,
          is_active: data.is_active ?? true,
          adminNote: data.adminNote?.trim() || null,
        },
        include: { createdBy: true, inforCompany: true },
      });
    });
  }

  async getAll(filter: CompanyRegistrationFilterType): Promise<CompanyRegistrationPaginType> {
    const items_per_pages = Number(filter.items_per_pages) || 10;
    const pages = Number(filter.pages) || 1;
    const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;
    const search = filter.search?.trim() || '';

    const whereCondition: any = {
      OR: [
        { companyName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    };

    if (filter.status) {
      whereCondition.status = filter.status;
    }

    const [registrations, total_items] = await Promise.all([
      this.prisma.companyRegistrationRequest.findMany({
        take: items_per_pages,
        skip,
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: true, inforCompany: true },
      }),
      this.prisma.companyRegistrationRequest.count({ where: whereCondition }),
    ]);

    return { data: registrations, current_pages: pages, items_per_pages, total_items };
  }

  async getByID(id: string) {
    const record = await this.prisma.companyRegistrationRequest.findUnique({
      where: { id },
      include: { createdBy: true, inforCompany: true },
    });
    if (!record) throw new NotFoundException('Company registration not found');
    return record;
  }

async approveRegistration(id: string) {
  const record = await this.prisma.companyRegistrationRequest.findUnique({
    where: { id },
  });
  if (!record) throw new NotFoundException('Company registration not found');

  const lastInfor = await this.prisma.inforCompany.findFirst({
    where: { infor_code: { not: null, startsWith: 'IC_' } },
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

  const inforCompany = await this.prisma.inforCompany.create({
    data: {
      full_name: record.companyName,
      email: record.email,
      phone_number: record.phone,
      address: record.address,
      website: record.website,
      description: record.recruitmentNeeds,
      status: 'Active',
      infor_code: inforCode,
    },
  });

  await this.prisma.companyRegistrationRequest.update({
    where: { id },
    data: {
      status: 'approved',
      inforCompanyId: inforCompany.id,
      approvedAt: new Date(),
    },
  });

  return inforCompany; // trả về công ty chính thức
}

async update(id: string, data: UpdateCompanyRegistrationDto) {
  const record = await this.prisma.companyRegistrationRequest.findUnique({
    where: { id },
  });
  if (!record) throw new NotFoundException('Company registration not found');

  if (data.status === 'approved') {
    return this.approveRegistration(id);
  }

  const updatePayload = {
    companyName: data.companyName?.trim(),
    email: data.email?.trim().toLowerCase(),
    phone: data.phone?.trim(),
    address: data.address?.trim(),
    website: data.website?.trim(),
    recruitmentNeeds: data.recruitmentNeeds?.trim(),
    source: data.source?.trim(),
    status: data.status,
    adminNote: data.adminNote?.trim(),
    is_active: data.is_active,
  };

  return this.prisma.companyRegistrationRequest.update({
    where: { id },
    data: updatePayload,
    include: { createdBy: true, inforCompany: true },
  });
}

  async delete(id: string) {
    const record = await this.prisma.companyRegistrationRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!record) throw new NotFoundException('Company registration not found');

    return this.prisma.companyRegistrationRequest.update({
      where: { id },
      data: {is_active: false}
    });
  }
}